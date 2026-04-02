import { watchFile, unwatchFile } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { EventEmitter } from './event-emitter';

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
  private emitter = new EventEmitter<CategoriesConfig>();
  private configPath: string;
  private isWatching = false;

  constructor() {
    const dataDir = process.env.DATA_DIR || join(process.cwd(), 'data');
    this.configPath = join(dataDir, 'categories.json');
    this.loadConfig();
    this.startWatching();
  }

  private async loadConfig(): Promise<void> {
    try {
      const content = await readFile(this.configPath, 'utf-8');
      this.config = JSON.parse(content);
      this.emitter.emit(this.config);
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
    return this.emitter.subscribe(listener);
  }

  stopWatching(): void {
    if (this.isWatching) {
      unwatchFile(this.configPath);
      this.isWatching = false;
    }
  }
}

export const categoryManager = new CategoryManager();
