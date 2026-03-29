# Home Hub 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 开发一个 Docker 服务导航站点，通过 Docker API 自动发现和展示带标签的容器服务，支持图标缓存和实时更新。

**Architecture:** React Router v7 框架模式，后端使用 dockerode 连接 Docker API，前端使用 SSE 接收实时更新，图标下载到本地缓存。

**Tech Stack:** React Router v7, TypeScript, Tailwind CSS, dockerode, Node.js

---

## 项目文件结构

```
home-hub/
├── app/
│   ├── components/
│   │   ├── ServiceCard.tsx       # 服务卡片组件
│   │   └── ServiceGrid.tsx       # 服务网格布局
│   ├── lib/
│   │   ├── docker.ts             # Docker API 客户端
│   │   ├── icons.ts              # 图标下载和管理
│   │   ├── store.ts              # 服务状态存储
│   │   └── utils.ts              # 工具函数
│   ├── routes/
│   │   ├── _index.tsx            # 首页路由
│   │   ├── api.services.ts       # 服务列表 API
│   │   └── api.events.ts         # SSE 事件流
│   ├── types/
│   │   └── index.ts              # TypeScript 类型定义
│   ├── root.tsx                  # 根组件
│   └── entry.server.tsx          # 服务端入口
├── data/
│   └── icons/                    # 图标缓存目录
├── public/                       # 静态资源
├── tests/
│   ├── docker.test.ts
│   ├── icons.test.ts
│   └── utils.test.ts
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.ts
```

---

## Phase 1: 项目初始化

### Task 1: 创建 React Router v7 项目

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `tailwind.config.ts`
- Create: `app/root.tsx`
- Create: `app/entry.server.tsx`

- [ ] **Step 1: 初始化 package.json**

```json
{
  "name": "home-hub",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router-serve ./build/server/index.js",
    "test": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@react-router/node": "^7.0.0",
    "@react-router/serve": "^7.0.0",
    "dockerode": "^4.0.2",
    "isomorphic-fetch": "^3.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^7.0.0"
  },
  "devDependencies": {
    "@react-router/dev": "^7.0.0",
    "@types/dockerode": "^3.3.31",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: 配置 TypeScript**

```json
{
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "./.react-router/types/**/*"
  ],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "types": ["@react-router/node", "vite/client", "node"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "rootDirs": [".", "./.react-router/types"],
    "baseUrl": ".",
    "paths": {
      "~/*": ["app/*"]
    },
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 3: 配置 Vite**

```typescript
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter(), tsconfigPaths()],
  server: {
    port: 3000,
  },
});
```

- [ ] **Step 4: 配置 Tailwind CSS**

```typescript
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 5: 创建 PostCSS 配置**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: 创建根组件**

```typescript
// app/root.tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";

import stylesheet from "./tailwind.css?url";

export const links: Route.LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

- [ ] **Step 7: 创建 Tailwind CSS 文件**

```css
/* app/tailwind.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 8: 安装依赖**

```bash
npm install
```

- [ ] **Step 9: 提交**

```bash
git add .
git commit -m "chore: initialize React Router v7 project with Tailwind CSS"
```

---

## Phase 2: 类型定义和工具函数

### Task 2: 创建类型定义

**Files:**
- Create: `app/types/index.ts`

- [ ] **Step 1: 定义服务类型**

```typescript
// app/types/index.ts

export interface Service {
  id: string;
  name: string;
  url: string;
  icon: string;
  category: string;
  description: string;
  status: 'running' | 'stopped' | 'unknown';
  order: number;
}

export interface ServiceConfig {
  name: string;
  url?: string;
  host?: string;
  port?: number;
  icon?: string;
  category?: string;
  description?: string;
  order?: number;
}

export interface IconManifest {
  [url: string]: string;
}

export interface DockerLabelConfig {
  'home-hub.name': string;
  'home-hub.url'?: string;
  'home-hub.host'?: string;
  'home-hub.port'?: string;
  'home-hub.icon'?: string;
  'home-hub.category'?: string;
  'home-hub.description'?: string;
  'home-hub.order'?: string;
}
```

- [ ] **Step 2: 提交**

```bash
git add app/types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

### Task 3: 创建工具函数

**Files:**
- Create: `app/lib/utils.ts`
- Create: `tests/utils.test.ts`

- [ ] **Step 1: 编写测试 - URL 构建**

```typescript
// tests/utils.test.ts
import { describe, it, expect } from 'vitest';
import { buildServiceUrl } from '../app/lib/utils';

describe('buildServiceUrl', () => {
  it('should use url when provided', () => {
    const result = buildServiceUrl({
      url: 'https://example.com/path',
      host: 'localhost',
      port: 8080,
    }, '192.168.1.1');
    expect(result).toBe('https://example.com/path');
  });

  it('should use host and port when url is not provided', () => {
    const result = buildServiceUrl({
      host: 'jellyfin.local',
      port: 8096,
    }, '192.168.1.1');
    expect(result).toBe('http://jellyfin.local:8096');
  });

  it('should use docker host IP when host is not provided', () => {
    const result = buildServiceUrl({
      port: 8080,
    }, '192.168.1.1');
    expect(result).toBe('http://192.168.1.1:8080');
  });

  it('should default port to 80', () => {
    const result = buildServiceUrl({}, '192.168.1.1');
    expect(result).toBe('http://192.168.1.1');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test
```

- [ ] **Step 3: 实现工具函数**

```typescript
// app/lib/utils.ts
import type { ServiceConfig } from '~/types';

export function buildServiceUrl(
  config: ServiceConfig,
  dockerHostIp: string
): string {
  // Priority 1: Use url if provided
  if (config.url) {
    return config.url;
  }

  // Priority 2: Build from host + port
  const host = config.host || dockerHostIp;
  const port = config.port || 80;
  
  if (port === 80) {
    return `http://${host}`;
  }
  
  return `http://${host}:${port}`;
}

export function parseLabelValue(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

export function parseLabelNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const num = parseInt(value, 10);
  return isNaN(num) ? undefined : num;
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test
```

- [ ] **Step 5: 提交**

```bash
git add app/lib/utils.ts tests/utils.test.ts
git commit -m "feat: add utility functions for URL building"
```

---

## Phase 3: Docker 模块

### Task 4: 创建 Docker 监控器

**Files:**
- Create: `app/lib/docker.ts`
- Create: `tests/docker.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
// tests/docker.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DockerMonitor } from '../app/lib/docker';

describe('DockerMonitor', () => {
  let monitor: DockerMonitor;

  beforeEach(() => {
    monitor = new DockerMonitor('/var/run/docker.sock');
  });

  it('should extract service config from container labels', () => {
    const containerInfo = {
      Id: 'abc123',
      Names: ['/test-container'],
      State: 'running',
      Labels: {
        'home-hub.name': 'Test Service',
        'home-hub.port': '8080',
        'home-hub.category': '工具',
      },
    };

    const config = monitor.extractServiceConfig(containerInfo);
    
    expect(config).toEqual({
      name: 'Test Service',
      port: 8080,
      category: '工具',
      description: undefined,
      icon: undefined,
      url: undefined,
      host: undefined,
      order: undefined,
    });
  });

  it('should return null for containers without home-hub.name label', () => {
    const containerInfo = {
      Id: 'abc123',
      Names: ['/test-container'],
      State: 'running',
      Labels: {
        'other.label': 'value',
      },
    };

    const config = monitor.extractServiceConfig(containerInfo);
    expect(config).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test
```

- [ ] **Step 3: 实现 Docker 监控器**

```typescript
// app/lib/docker.ts
import Docker from 'dockerode';
import type { Service, ServiceConfig, DockerLabelConfig } from '~/types';
import { buildServiceUrl, parseLabelValue, parseLabelNumber } from './utils';

interface ContainerInfo {
  Id: string;
  Names: string[];
  State: string;
  Labels?: Record<string, string>;
}

export class DockerMonitor {
  private docker: Docker;
  private dockerHostIp: string;
  private eventHandlers: ((services: Service[]) => void)[] = [];

  constructor(socketPath: string, dockerHostIp: string = 'localhost') {
    this.docker = new Docker({ socketPath });
    this.dockerHostIp = dockerHostIp;
  }

  extractServiceConfig(container: ContainerInfo): ServiceConfig | null {
    const labels = container.Labels || {};
    const name = labels['home-hub.name'];

    if (!name) {
      return null;
    }

    return {
      name: name.trim(),
      url: parseLabelValue(labels['home-hub.url']),
      host: parseLabelValue(labels['home-hub.host']),
      port: parseLabelNumber(labels['home-hub.port']),
      icon: parseLabelValue(labels['home-hub.icon']),
      category: parseLabelValue(labels['home-hub.category']) || '其他',
      description: parseLabelValue(labels['home-hub.description']),
      order: parseLabelNumber(labels['home-hub.order']) || 0,
    };
  }

  async scanServices(): Promise<Service[]> {
    const containers = await this.docker.listContainers({ all: true });
    const services: Service[] = [];

    for (const container of containers) {
      const config = this.extractServiceConfig(container as ContainerInfo);
      if (config) {
        const url = buildServiceUrl(config, this.dockerHostIp);
        services.push({
          id: container.Id,
          name: config.name,
          url,
          icon: config.icon || '',
          category: config.category,
          description: config.description || '',
          status: container.State === 'running' ? 'running' : 'stopped',
          order: config.order || 0,
        });
      }
    }

    // Sort by order
    return services.sort((a, b) => a.order - b.order);
  }

  async startEventListener(): Promise<void> {
    const stream = await this.docker.getEvents();
    
    stream.on('data', async (chunk: Buffer) => {
      try {
        const event = JSON.parse(chunk.toString());
        
        // Only handle container-related events
        if (event.Type === 'container') {
          const services = await this.scanServices();
          this.notifyHandlers(services);
        }
      } catch (error) {
        console.error('Error parsing Docker event:', error);
      }
    });

    stream.on('error', (error) => {
      console.error('Docker event stream error:', error);
    });
  }

  onServicesUpdate(handler: (services: Service[]) => void): void {
    this.eventHandlers.push(handler);
  }

  private notifyHandlers(services: Service[]): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(services);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    }
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test
```

- [ ] **Step 5: 提交**

```bash
git add app/lib/docker.ts tests/docker.test.ts
git commit -m "feat: add Docker monitor with event listening"
```

---

## Phase 4: 图标管理模块

### Task 5: 创建图标管理器

**Files:**
- Create: `app/lib/icons.ts`
- Create: `tests/icons.test.ts`

- [ ] **Step 1: 编写测试**

```typescript
// tests/icons.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IconManager } from '../app/lib/icons';
import * as fs from 'fs';
import * as path from 'path';

describe('IconManager', () => {
  const testDataDir = './test-data/icons';
  let manager: IconManager;

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true });
    }
    fs.mkdirSync(testDataDir, { recursive: true });
    
    manager = new IconManager(testDataDir);
  });

  it('should generate hash from URL', () => {
    const hash = manager.getUrlHash('https://example.com/icon.png');
    expect(hash).toHaveLength(12);
    expect(typeof hash).toBe('string');
  });

  it('should return consistent hash for same URL', () => {
    const url = 'https://example.com/icon.png';
    const hash1 = manager.getUrlHash(url);
    const hash2 = manager.getUrlHash(url);
    expect(hash1).toBe(hash2);
  });

  it('should return icon path if already cached', () => {
    const url = 'https://example.com/icon.png';
    const hash = manager.getUrlHash(url);
    const ext = 'png';
    const iconPath = path.join(testDataDir, `${hash}.${ext}`);
    
    // Create dummy file
    fs.writeFileSync(iconPath, 'dummy');
    
    // Create manifest
    fs.writeFileSync(
      path.join(testDataDir, 'manifest.json'),
      JSON.stringify({ [url]: hash })
    );

    const result = manager.getIconPath(url);
    expect(result).toBe(`/icons/${hash}.png`);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

```bash
npm test
```

- [ ] **Step 3: 实现图标管理器**

```typescript
// app/lib/icons.ts
import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import type { IconManifest } from '~/types';

export class IconManager {
  private iconsDir: string;
  private manifestPath: string;
  private manifest: IconManifest = {};

  constructor(dataDir: string) {
    this.iconsDir = path.join(dataDir, 'icons');
    this.manifestPath = path.join(this.iconsDir, 'manifest.json');
    this.ensureDirectories();
    this.loadManifest();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.iconsDir)) {
      fs.mkdirSync(this.iconsDir, { recursive: true });
    }
  }

  private loadManifest(): void {
    if (fs.existsSync(this.manifestPath)) {
      const content = fs.readFileSync(this.manifestPath, 'utf-8');
      this.manifest = JSON.parse(content);
    }
  }

  private saveManifest(): void {
    fs.writeFileSync(this.manifestPath, JSON.stringify(this.manifest, null, 2));
  }

  getUrlHash(url: string): string {
    return createHash('sha256').update(url).digest('hex').slice(0, 12);
  }

  getIconPath(url: string): string | null {
    if (!url) return null;

    const hash = this.manifest[url];
    if (!hash) return null;

    const files = fs.readdirSync(this.iconsDir);
    const iconFile = files.find(f => f.startsWith(hash));
    
    if (iconFile) {
      return `/icons/${iconFile}`;
    }

    return null;
  }

  async downloadIcon(url: string): Promise<string | null> {
    if (!url) return null;

    const hash = this.getUrlHash(url);
    const currentHash = this.manifest[url];

    // Check if icon is already cached with same hash
    if (currentHash === hash) {
      const cachedPath = this.getIconPath(url);
      if (cachedPath) {
        return cachedPath;
      }
    }

    try {
      const response = await fetch(url, {
        timeout: 10000,
      } as RequestInit);

      if (!response.ok) {
        console.error(`Failed to download icon: ${url} - ${response.status}`);
        return null;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        console.error(`Invalid content type for icon: ${contentType}`);
        return null;
      }

      // Determine file extension from content type or URL
      let ext = 'png';
      if (contentType.includes('svg')) {
        ext = 'svg';
      } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
        ext = 'jpg';
      } else if (contentType.includes('ico')) {
        ext = 'ico';
      } else if (url.endsWith('.svg')) {
        ext = 'svg';
      } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
        ext = 'jpg';
      } else if (url.endsWith('.ico')) {
        ext = 'ico';
      }

      const buffer = await response.arrayBuffer();
      
      // Limit file size to 1MB
      if (buffer.byteLength > 1024 * 1024) {
        console.error(`Icon file too large: ${url}`);
        return null;
      }

      const iconPath = path.join(this.iconsDir, `${hash}.${ext}`);
      fs.writeFileSync(iconPath, Buffer.from(buffer));

      // Update manifest
      this.manifest[url] = hash;
      this.saveManifest();

      return `/icons/${hash}.${ext}`;
    } catch (error) {
      console.error(`Error downloading icon ${url}:`, error);
      return null;
    }
  }

  async updateServiceIcons(services: Array<{ icon?: string }>): Promise<void> {
    const downloadPromises = services
      .filter(s => s.icon)
      .map(s => this.downloadIcon(s.icon!));

    await Promise.all(downloadPromises);
  }
}
```

- [ ] **Step 4: 运行测试确认通过**

```bash
npm test
```

- [ ] **Step 5: 提交**

```bash
git add app/lib/icons.ts tests/icons.test.ts
git commit -m "feat: add icon manager with caching and download"
```

---

## Phase 5: 服务存储模块

### Task 6: 创建服务存储

**Files:**
- Create: `app/lib/store.ts`

- [ ] **Step 1: 实现服务存储**

```typescript
// app/lib/store.ts
import type { Service } from '~/types';

export class ServiceStore {
  private services: Service[] = [];
  private listeners: ((services: Service[]) => void)[] = [];

  getServices(): Service[] {
    return [...this.services];
  }

  setServices(services: Service[]): void {
    this.services = services;
    this.notifyListeners();
  }

  updateService(updatedService: Service): void {
    const index = this.services.findIndex(s => s.id === updatedService.id);
    if (index >= 0) {
      this.services[index] = updatedService;
      this.notifyListeners();
    }
  }

  onChange(listener: (services: Service[]) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
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
        listener(this.services);
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    }
  }
}

// Singleton instance
export const serviceStore = new ServiceStore();
```

- [ ] **Step 2: 提交**

```bash
git add app/lib/store.ts
git commit -m "feat: add service store with state management"
```

---

## Phase 6: API 路由

### Task 7: 创建服务列表 API

**Files:**
- Create: `app/routes/api.services.ts`
- Modify: `app/lib/docker.ts` (export instance)

- [ ] **Step 1: 创建服务列表 API**

```typescript
// app/routes/api.services.ts
import type { Route } from "./+types/api.services";
import { serviceStore } from "~/lib/store";

export async function loader({ request }: Route.LoaderArgs) {
  const services = serviceStore.getServices();
  
  return new Response(JSON.stringify({ services }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

- [ ] **Step 2: 提交**

```bash
git add app/routes/api.services.ts
git commit -m "feat: add API endpoint for service list"
```

### Task 8: 创建 SSE 事件流 API

**Files:**
- Create: `app/routes/api.events.ts`

- [ ] **Step 1: 创建 SSE 端点**

```typescript
// app/routes/api.events.ts
import type { Route } from "./+types/api.events";
import { serviceStore } from "~/lib/store";

export async function loader({ request }: Route.LoaderArgs) {
  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const services = serviceStore.getServices();
      controller.enqueue(
        `data: ${JSON.stringify({ type: 'services.update', services })}\n\n`
      );

      // Subscribe to store changes
      const unsubscribe = serviceStore.onChange((services) => {
        try {
          controller.enqueue(
            `data: ${JSON.stringify({ type: 'services.update', services })}\n\n`
          );
        } catch (error) {
          // Client disconnected
          unsubscribe();
        }
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(`:heartbeat\n\n`);
        } catch (error) {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 30000);

      // Cleanup on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

- [ ] **Step 2: 提交**

```bash
git add app/routes/api.events.ts
git commit -m "feat: add SSE endpoint for real-time updates"
```

### Task 9: 创建图标服务路由

**Files:**
- Create: `app/routes/icons.$.ts`

- [ ] **Step 1: 创建图标路由**

```typescript
// app/routes/icons.$.ts
import type { Route } from "./+types/icons.$";
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = process.env.DATA_DIR || './data';
const ICONS_DIR = path.join(DATA_DIR, 'icons');

export async function loader({ params }: Route.LoaderArgs) {
  const filename = params['*'];
  
  if (!filename || filename.includes('..')) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = path.join(ICONS_DIR, filename);
  
  // Security check: ensure file is within icons directory
  if (!filePath.startsWith(ICONS_DIR)) {
    return new Response('Not found', { status: 404 });
  }

  if (!fs.existsSync(filePath)) {
    return new Response('Not found', { status: 404 });
  }

  const content = fs.readFileSync(filePath);
  const ext = path.extname(filename).toLowerCase();
  
  const contentTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
  };

  return new Response(content, {
    headers: {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000', // 1 year
    },
  });
}
```

- [ ] **Step 2: 提交**

```bash
git add app/routes/icons.$.ts
git commit -m "feat: add icon serving endpoint with caching"
```

---

## Phase 7: 前端组件

### Task 10: 创建 SSE 客户端 hook

**Files:**
- Create: `app/lib/use-sse.ts`

- [ ] **Step 1: 创建 SSE hook**

```typescript
// app/lib/use-sse.ts
import { useEffect, useState, useCallback } from 'react';
import type { Service } from '~/types';

interface SSEMessage {
  type: 'services.update';
  services: Service[];
}

export function useSSE() {
  const [services, setServices] = useState<Service[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      eventSource = new EventSource('/api/events');

      eventSource.onopen = () => {
        setConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);
          if (data.type === 'services.update') {
            setServices(data.services);
          }
        } catch (err) {
          console.error('Failed to parse SSE message:', err);
        }
      };

      eventSource.onerror = () => {
        setConnected(false);
        setError('Connection lost');
        eventSource?.close();
        
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      eventSource?.close();
    };
  }, []);

  return { services, connected, error };
}
```

- [ ] **Step 2: 提交**

```bash
git add app/lib/use-sse.ts
git commit -m "feat: add SSE hook for real-time updates"
```

### Task 11: 创建服务卡片组件

**Files:**
- Create: `app/components/ServiceCard.tsx`

- [ ] **Step 1: 创建服务卡片**

```typescript
// app/components/ServiceCard.tsx
import type { Service } from '~/types';

interface ServiceCardProps {
  service: Service;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusColor(status: Service['status']): string {
  switch (status) {
    case 'running':
      return 'bg-green-500';
    case 'stopped':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function ServiceCard({ service }: ServiceCardProps) {
  const hasIcon = service.icon && service.icon.length > 0;

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex flex-col items-center">
        {/* Icon */}
        <div className="mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {hasIcon ? (
            <img
              src={service.icon}
              alt={service.name}
              className="h-full w-full object-contain"
              onError={(e) => {
                // Fallback to initials on error
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                  <span class="text-2xl font-bold text-gray-600">${getInitials(service.name)}</span>
                `;
              }}
            />
          ) : (
            <span className="text-2xl font-bold text-gray-600">
              {getInitials(service.name)}
            </span>
          )}
        </div>

        {/* Name and Status */}
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {service.name}
          </h3>
          <span
            className={`h-2.5 w-2.5 rounded-full ${getStatusColor(service.status)}`}
            title={service.status === 'running' ? '在线' : '离线'}
          />
        </div>

        {/* Description */}
        {service.description && (
          <p className="mt-2 text-center text-sm text-gray-500">
            {service.description}
          </p>
        )}

        {/* Category */}
        <span className="mt-3 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
          {service.category}
        </span>
      </div>
    </a>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add app/components/ServiceCard.tsx
git commit -m "feat: add ServiceCard component with status indicator"
```

### Task 12: 创建服务网格组件

**Files:**
- Create: `app/components/ServiceGrid.tsx`

- [ ] **Step 1: 创建服务网格**

```typescript
// app/components/ServiceGrid.tsx
import { ServiceCard } from './ServiceCard';
import type { Service } from '~/types';

interface ServiceGridProps {
  services: Service[];
}

export function ServiceGrid({ services }: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">没有找到服务</p>
      </div>
    );
  }

  // Group services by category
  const grouped = services.reduce((acc, service) => {
    const category = service.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, categoryServices]) => (
        <div key={category}>
          <h2 className="mb-4 text-xl font-bold text-gray-800">{category}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {categoryServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: 提交**

```bash
git add app/components/ServiceGrid.tsx
git commit -m "feat: add ServiceGrid component with category grouping"
```

---

## Phase 8: 首页路由

### Task 13: 创建首页

**Files:**
- Create: `app/routes/_index.tsx`
- Modify: `app/lib/docker.ts` (添加初始化逻辑)

- [ ] **Step 1: 修改 entry.server.tsx 添加初始化**

```typescript
// app/entry.server.tsx
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "stream";
import { DockerMonitor } from "./lib/docker";
import { IconManager } from "./lib/icons";
import { serviceStore } from "./lib/store";

const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const DATA_DIR = process.env.DATA_DIR || "./data";
const DOCKER_HOST_IP = process.env.DOCKER_HOST_IP || "localhost";

// Initialize Docker monitor and icon manager
const dockerMonitor = new DockerMonitor(DOCKER_SOCKET, DOCKER_HOST_IP);
const iconManager = new IconManager(DATA_DIR);

// Initial scan and setup
async function initializeServices() {
  try {
    const services = await dockerMonitor.scanServices();
    
    // Download icons for services
    await iconManager.updateServiceIcons(services);
    
    // Update icon paths
    const servicesWithIcons = services.map(service => ({
      ...service,
      icon: iconManager.getIconPath(service.icon) || service.icon,
    }));
    
    serviceStore.setServices(servicesWithIcons);
    
    // Start listening for Docker events
    await dockerMonitor.startEventListener();
    
    // Subscribe to Docker events
    dockerMonitor.onServicesUpdate(async (services) => {
      await iconManager.updateServiceIcons(services);
      const servicesWithIcons = services.map(service => ({
        ...service,
        icon: iconManager.getIconPath(service.icon) || service.icon,
      }));
      serviceStore.setServices(servicesWithIcons);
    });
    
    console.log("Home Hub initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
  }
}

// Run initialization
initializeServices();

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: AppLoadContext
) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const userAgent = request.headers.get("user-agent");

    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={routerContext} url={request.url} />,
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(body as any, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        },
      }
    );

    setTimeout(abort, 10000);
  });
}
```

- [ ] **Step 2: 创建首页**

```typescript
// app/routes/_index.tsx
import { useSSE } from "~/lib/use-sse";
import { ServiceGrid } from "~/components/ServiceGrid";

export default function Index() {
  const { services, connected, error } = useSSE();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Home Hub</h1>
            <div className="flex items-center gap-2">
              <span
                className={`h-3 w-3 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`}
                title={connected ? "已连接" : "未连接"}
              />
              <span className="text-sm text-gray-500">
                {connected ? "实时更新中" : "连接断开"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 px-4 py-3">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <ServiceGrid services={services} />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: 提交**

```bash
git add app/entry.server.tsx app/routes/_index.tsx
git commit -m "feat: add index page with SSE integration"
```

---

## Phase 9: Docker 和部署配置

### Task 14: 创建 Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: 创建 Dockerfile**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

# Create data directory for icons
RUN mkdir -p /data/icons

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data
ENV DOCKER_SOCKET=/var/run/docker.sock

EXPOSE 3000

CMD ["npm", "start"]
```

- [ ] **Step 2: 提交**

```bash
git add Dockerfile
git commit -m "chore: add Dockerfile for containerization"
```

### Task 15: 创建 Docker Compose 配置

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: 创建 Docker Compose**

```yaml
version: '3.8'

services:
  home-hub:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: home-hub
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATA_DIR=/data
      - DOCKER_SOCKET=/var/run/docker.sock
      # Auto-detect Docker host IP
      - DOCKER_HOST_IP=${DOCKER_HOST_IP:-host.docker.internal}
    volumes:
      # Mount Docker socket (read-only)
      - /var/run/docker.sock:/var/run/docker.sock:ro
      # Persist icon cache
      - ./data:/data
    ports:
      - "3000:3000"
    networks:
      - home-hub-network

networks:
  home-hub-network:
    driver: bridge
```

- [ ] **Step 2: 创建 .dockerignore**

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.data
build
dist
```

- [ ] **Step 3: 提交**

```bash
git add docker-compose.yml .dockerignore
git commit -m "chore: add Docker Compose configuration"
```

---

## Phase 10: 测试和优化

### Task 16: 添加健康检查

**Files:**
- Create: `app/routes/api.health.ts`

- [ ] **Step 1: 创建健康检查端点**

```typescript
// app/routes/api.health.ts
import type { Route } from "./+types/api.health";

export async function loader({ request }: Route.LoaderArgs) {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  return new Response(JSON.stringify(health), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
```

- [ ] **Step 2: 提交**

```bash
git add app/routes/api.health.ts
git commit -m "feat: add health check endpoint"
```

### Task 17: 最终验证

- [ ] **Step 1: 运行类型检查**

```bash
npm run typecheck
```

- [ ] **Step 2: 运行测试**

```bash
npm test
```

- [ ] **Step 3: 构建项目**

```bash
npm run build
```

- [ ] **Step 4: 提交最终代码**

```bash
git add .
git commit -m "chore: final build and verification"
```

---

## 总结

### 已实现功能

1. ✅ Docker API 连接和容器扫描
2. ✅ 标签解析（支持 home-hub.name, home-hub.url, home-hub.host, home-hub.port 等）
3. ✅ URL 构建优先级（url > host+port > docker host IP）
4. ✅ 图标下载和本地缓存
5. ✅ 图标 URL 变更检测
6. ✅ 实时更新（SSE）
7. ✅ 服务状态显示
8. ✅ 分类分组显示
9. ✅ 响应式网格布局
10. ✅ Docker 容器化部署

### 待测试清单

- [ ] 启动时扫描容器
- [ ] 容器启动/停止事件检测
- [ ] 标签变更实时更新
- [ ] 图标下载和缓存
- [ ] 图标 URL 变更自动更新
- [ ] SSE 连接和重连
- [ ] 响应式布局
- [ ] Docker Compose 部署

### 使用示例

```yaml
version: '3'
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    labels:
      - "home-hub.name=Jellyfin"
      - "home-hub.port=8096"
      - "home-hub.category=媒体"
      - "home-hub.icon=https://jellyfin.org/images/icon.png"
    ports:
      - "8096:8096"

  nextcloud:
    image: nextcloud:latest
    labels:
      - "home-hub.name=Nextcloud"
      - "home-hub.url=https://cloud.example.com"
      - "home-hub.category=工具"
```

---

**计划完成时间:** 约 2-3 小时（按顺序执行所有任务）

**部署命令:**
```bash
# 本地开发
npm install
npm run dev

# Docker 部署
docker-compose up -d
```
