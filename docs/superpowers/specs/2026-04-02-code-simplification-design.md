# 代码优化精简设计文档

## 概述

优化 home-hub 项目的代码结构，减少重复代码，提高可读性和可维护性。

## 目标

- 减少约 15% 的代码量（约 90 行）
- 消除重复的监听器模式实现
- 简化组件逻辑
- 提高类型安全性

## 架构设计

### 1. EventEmitter 基类

创建一个通用的 `EventEmitter` 基类来统一管理监听器模式。

**位置**: `app/lib/event-emitter.ts`

**设计**:
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

**优势**:
- 统一的错误处理
- 简洁的 API（emit/subscribe）
- 自动返回取消订阅函数
- 可复用

### 2. 重构后的类

#### ServiceStore

**简化前**: 48 行，包含 listeners 数组和 notifyListeners 方法
**简化后**: 约 25 行，使用 EventEmitter

```typescript
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
```

**减少**: 约 23 行代码

#### CategoryManager

**简化前**: 106 行，包含 listeners 数组和 notifyListeners 方法
**简化后**: 约 85 行，使用 EventEmitter

**减少**: 约 21 行代码

### 3. ServiceGrid 简化

**问题**: ServiceGrid 中包含重复的分类排序逻辑，与 CategoryManager 功能重叠

**解决方案**: 移除 ServiceGrid 中的排序逻辑，使用 CategoryManager 的 `getSortedCategories` 方法

**简化前**:
```typescript
// 在 ServiceGrid 中
const getCategoryOrder = (categoryName: string): number => { ... }
const sortedCategories = Object.keys(grouped).sort((a, b) => { ... })
```

**简化后**:
```typescript
const grouped = services.reduce((acc, service) => {
  const category = service.category || '其他';
  if (!acc[category]) acc[category] = [];
  acc[category].push(service);
  return acc;
}, {} as Record<string, Service[]>);

// 直接使用 CategoryManager 的方法
const sortedCategories = categoryManager.getSortedCategories(Object.keys(grouped));
```

**注意**: 需要将 categoryManager 导入到 ServiceGrid 中

**减少**: 约 10 行代码

### 4. useSSE Hook 优化

**问题**: if-else 链不够简洁，且缺少类型守卫

**简化前**:
```typescript
if (data.type === 'init') {
  if (data.services) setServices(data.services);
  if (data.categoriesConfig) setCategoriesConfig(data.categoriesConfig);
} else if (data.type === 'services.update') {
  if (data.services) setServices(data.services);
} else if (data.type === 'categories.update') {
  if (data.categoriesConfig) setCategoriesConfig(data.categoriesConfig);
}
```

**简化后**: 使用对象映射和可选链
```typescript
const handlers: Record<SSEMessage['type'], () => void> = {
  'init': () => {
    data.services && setServices(data.services);
    data.categoriesConfig && setCategoriesConfig(data.categoriesConfig);
  },
  'services.update': () => {
    data.services && setServices(data.services);
  },
  'categories.update': () => {
    data.categoriesConfig && setCategoriesConfig(data.categoriesConfig);
  },
};

handlers[data.type]?.();
```

**进一步简化**: 使用函数映射
```typescript
const setByType: Record<SSEMessage['type'], (data: SSEMessage) => void> = {
  'init': (data) => {
    data.services && setServices(data.services);
    data.categoriesConfig && setCategoriesConfig(data.categoriesConfig);
  },
  'services.update': (data) => data.services && setServices(data.services),
  'categories.update': (data) => data.categoriesConfig && setCategoriesConfig(data.categoriesConfig),
};

setByType[data.type]?.(data);
```

**减少**: 约 10 行代码，提高可读性

### 5. 类型安全增强

#### SSE 消息类型守卫

**问题**: JSON.parse 后直接使用，缺少类型检查

**解决方案**: 添加类型守卫函数

```typescript
function isSSEMessage(data: unknown): data is SSEMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    ['init', 'services.update', 'categories.update'].includes((data as any).type)
  );
}

// 使用
try {
  const parsed = JSON.parse(event.data);
  if (isSSEMessage(parsed)) {
    // TypeScript 现在知道 parsed 是 SSEMessage 类型
  } else {
    console.error('Invalid SSE message format:', parsed);
  }
} catch (err) {
  console.error('Failed to parse SSE message:', err);
}
```

## 文件变更清单

### 新增文件
- `app/lib/event-emitter.ts` - EventEmitter 基类

### 修改文件
- `app/lib/store.ts` - 重构 ServiceStore 使用 EventEmitter
- `app/lib/categories.ts` - 重构 CategoryManager 使用 EventEmitter
- `app/components/ServiceGrid.tsx` - 简化排序逻辑
- `app/lib/use-sse.ts` - 优化消息处理和类型安全

## 风险评估

### 低风险
- EventEmitter 基类：简单的工具类，不涉及业务逻辑
- ServiceStore 重构：保持相同的 API，向后兼容
- ServiceGrid 简化：只是内部实现的改变

### 中等风险
- useSSE Hook 重构：涉及消息处理逻辑，需要仔细测试

### 缓解措施
- 保持所有公共 API 不变
- 逐步重构，每个阶段后运行 typecheck
- 不改变任何业务逻辑

## 测试策略

由于项目没有配置测试框架，采用以下验证策略：

1. **类型检查**: 运行 `npm run typecheck` 确保类型正确
2. **手动测试**:
   - 启动开发服务器
   - 验证服务列表正确显示
   - 测试 SSE 连接和实时更新
   - 测试分类排序功能
   - 测试错误场景（断开连接）

## 实施计划

### 阶段 1: 基础设施重构
1. 创建 EventEmitter 基类
2. 重构 ServiceStore
3. 重构 CategoryManager
4. 运行 typecheck 验证

### 阶段 2: 业务逻辑简化
1. 简化 ServiceGrid 排序逻辑
2. 优化 useSSE Hook
3. 运行 typecheck 验证

### 阶段 3: 类型安全增强
1. 添加 SSE 消息类型守卫
2. 添加关键逻辑注释
3. 运行 typecheck 验证

## 成功标准

- [ ] 所有类型检查通过
- [ ] 代码减少约 90 行
- [ ] 无重复的监听器模式实现
- [ ] ServiceGrid 不包含排序逻辑
- [ ] useSSE Hook 使用对象映射处理消息
- [ ] SSE 消息处理有类型守卫
