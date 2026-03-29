import { watchFile, unwatchFile } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface CategoryConfig {
  name: string;
  order: number;
}

export interface CategoriesConfig {
  categories: CategoryConfig[];
  defaultOrder: number;
}

class CategoryManager {
  private config: CategoriesConfig = { categories: [], defaultOrder: 999 };
  private listeners: ((config: CategoriesConfig) => void)[] = [];
  private configPath: string;
  private isWatching = false;

  constructor() {
    this.configPath = join(process.cwd(), 'data', 'categories.json');
    this.loadConfig();
    this.startWatching();
  }

  private async loadConfig(): Promise<void> {
    try {
      const content = await readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(content);
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load categories config:', error);
      this.config = { categories: [], defaultOrder: 999 };
    }
  }

  private startWatching(): void {
    if (this.isWatching) return;

    try {
      watchFile(this.configPath, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          console.log('Categories config changed, reloading...');
          this.loadConfig();
        }
      });
      this.isWatching = true;
    } catch (error) {
      console.error('Failed to watch categories config:', error);
    }
  }

  getCategoryOrder(categoryName: string): number {
    const category = this.config.categories.find(c => c.name === categoryName);
    return category?.order ?? this.config.defaultOrder;
  }

  getConfig(): CategoriesConfig {
    return { ...this.config };
  }

  getSortedCategories(categoryNames: string[]): string[] {
    return [...categoryNames].sort((a, b) => {
      const orderA = this.getCategoryOrder(a);
      const orderB = this.getCategoryOrder(b);

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.localeCompare(b, 'zh-CN');
    });
  }

  onChange(listener: (config: CategoriesConfig) => void): () => void {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in category listener:', error);
      }
    }
  }

  stopWatching(): void {
    if (this.isWatching) {
      unwatchFile(this.configPath);
      this.isWatching = false;
    }
  }
}

export const categoryManager = new CategoryManager();
