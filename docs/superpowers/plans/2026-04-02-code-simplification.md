# 代码优化精简实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构代码以减少重复、简化逻辑、提高类型安全

**Architecture:** 创建 EventEmitter 基类统一监听器模式，简化 ServiceGrid 和 useSSE，增强类型安全

**Tech Stack:** TypeScript, React Router v7, 无测试框架

---

## 阶段 1: EventEmitter 基类重构

### Task 1: 创建 EventEmitter 基类

**Files:**
- Create: `app/lib/event-emitter.ts`

- [ ] **Step 1: 创建 EventEmitter 基类**

```typescript
type Listener<T> = (data: T) => void;

export class EventEmitter<T> {
  private listeners: Listener<T>[] = [];

  emit(data: T): void {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    }
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) {
        this.listeners.splice(index, 1);
      }
    };
  }
}
```

- [ ] **Step 2: 运行 typecheck 验证**

Run: `npm run typecheck`
Expected: PASS (无类型错误)

- [ ] **Step 3: 提交**

```bash
git add app/lib/event-emitter.ts
git commit -m "refactor: add EventEmitter base class"
```

### Task 2: 重构 ServiceStore 使用 EventEmitter

**Files:**
- Modify: `app/lib/store.ts`

- [ ] **Step 1: 重构 ServiceStore**

将 `app/lib/store.ts` 替换为：

```typescript
import type { Service } from '~/types';
import { EventEmitter } from './event-emitter';

export class ServiceStore {
  private services: Service[] = [];
  private emitter = new EventEmitter<Service[]>();

  getServices(): Service[] {
    return [...this.services];
  }

  setServices(services: Service[]): void {
    this.services = services;
    this.emitter.emit(this.services);
  }

  updateService(updatedService: Service): void {
    const index = this.services.findIndex(s => s.id === updatedService.id);
    if (index >= 0) {
      this.services[index] = updatedService;
      this.emitter.emit(this.services);
    }
  }

  onChange(listener: (services: Service[]) => void): () => void {
    return this.emitter.subscribe(listener);
  }
}

export const serviceStore = new ServiceStore();
```

- [ ] **Step 2: 运行 typecheck 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add app/lib/store.ts
git commit -m "refactor: simplify ServiceStore with EventEmitter"
```

### Task 3: 重构 CategoryManager 使用 EventEmitter

**Files:**
- Modify: `app/lib/categories.ts`

- [ ] **Step 1: 重构 CategoryManager**

修改 `app/lib/categories.ts`：
1. 添加 import: `import { EventEmitter } from './event-emitter';`
2. 将 `private listeners` 改为 `private emitter = new EventEmitter<CategoriesConfig>();`
3. 删除 `notifyListeners` 方法
4. 将 `onChange` 方法改为：

```typescript
onChange(listener: (config: CategoriesConfig) => void): () => void {
  return this.emitter.subscribe(listener);
}
```

5. 在 `loadConfig` 方法中，将 `this.notifyListeners()` 改为 `this.emitter.emit(this.config)`

完整修改后的文件：

```typescript
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
```

- [ ] **Step 2: 运行 typecheck 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add app/lib/categories.ts
git commit -m "refactor: simplify CategoryManager with EventEmitter"
```

## 阶段 2: 业务逻辑简化

### Task 4: 简化 ServiceGrid 排序逻辑

**Files:**
- Modify: `app/components/ServiceGrid.tsx`

- [ ] **Step 1: 简化 ServiceGrid**

修改 `app/components/ServiceGrid.tsx`：
1. 添加 import: `import { categoryManager } from '~/lib/categories';`
2. 删除 `getCategoryOrder` 函数定义
3. 删除 `sortedCategories` 的排序逻辑，改为使用 `categoryManager.getSortedCategories`

完整修改后的文件：

```typescript
import { ServiceCard } from './ServiceCard';
import type { Service } from '~/types';
import type { CategoriesConfig } from '~/lib/categories';
import { categoryManager } from '~/lib/categories';

interface ServiceGridProps {
  services: Service[];
  categoriesConfig: CategoriesConfig;
}

export function ServiceGrid({ services, categoriesConfig }: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">没有找到服务</p>
      </div>
    );
  }

  const grouped = services.reduce((acc, service) => {
    const category = service.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const sortedCategories = categoryManager.getSortedCategories(Object.keys(grouped));

  return (
    <div className="space-y-8">
      {sortedCategories.map((category) => (
        <div key={category}>
          <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-gray-200">{category}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {grouped[category].map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 运行 typecheck 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add app/components/ServiceGrid.tsx
git commit -m "refactor: simplify ServiceGrid sorting logic"
```

### Task 5: 优化 useSSE Hook

**Files:**
- Modify: `app/lib/use-sse.ts`

- [ ] **Step 1: 优化消息处理逻辑**

修改 `app/lib/use-sse.ts`：
1. 在 `SSEMessage` 接口之后添加类型守卫函数：

```typescript
function isSSEMessage(data: unknown): data is SSEMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    ['init', 'services.update', 'categories.update'].includes((data as any).type)
  );
}
```

2. 将 `eventSource.onmessage` 的处理逻辑改为使用对象映射：

```typescript
eventSource.onmessage = (event) => {
  try {
    const parsed = JSON.parse(event.data);
    
    if (!isSSEMessage(parsed)) {
      console.error('Invalid SSE message format:', parsed);
      return;
    }

    const handlers: Record<SSEMessage['type'], () => void> = {
      'init': () => {
        parsed.services && setServices(parsed.services);
        parsed.categoriesConfig && setCategoriesConfig(parsed.categoriesConfig);
      },
      'services.update': () => {
        parsed.services && setServices(parsed.services);
      },
      'categories.update': () => {
        parsed.categoriesConfig && setCategoriesConfig(parsed.categoriesConfig);
      },
    };

    handlers[parsed.type]?.();
  } catch (err) {
    console.error('Failed to parse SSE message:', err);
  }
};
```

- [ ] **Step 2: 运行 typecheck 验证**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add app/lib/use-sse.ts
git commit -m "refactor: optimize useSSE with type guard and handler map"
```

## 阶段 3: 验证和清理

### Task 6: 最终验证

- [ ] **Step 1: 运行完整 typecheck**

Run: `npm run typecheck`
Expected: PASS (所有类型检查通过)

- [ ] **Step 2: 启动开发服务器测试**

Run: `npm run dev`
Manual Test:
- 访问 http://localhost:5173
- 验证服务列表正确显示
- 验证分类排序正确
- 验证实时更新功能
- 测试断开连接重连

Expected: 所有功能正常

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "refactor: complete code simplification - reduce ~90 lines"
```

## 成功标准

- [ ] 减少 ~90 行代码
- [ ] 所有 typecheck 通过
- [ ] 功能测试通过
- [ ] 无重复的监听器模式实现
- [ ] ServiceGrid 排序逻辑简化
- [ ] useSSE 有类型守卫

## 风险缓解

如果任何步骤失败：
1. 停止并检查错误信息
2. 如果是类型错误，检查导入和类型定义
3. 如果是运行时错误，检查逻辑是否正确
4. 必要时回退到上一个 commit
