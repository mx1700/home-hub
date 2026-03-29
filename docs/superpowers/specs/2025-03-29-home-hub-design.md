# Home Hub - Docker 导航站点设计文档

**日期**: 2025-03-29  
**版本**: 1.0

---

## 1. 项目概述

Home Hub 是一个自用的 Docker 服务导航站点，通过连接 Docker API 自动扫描容器，识别带有特定标签的服务，并生成美观的导航页面。

### 1.1 核心功能

- **自动发现**: 连接 Docker API 扫描容器
- **标签配置**: 通过 `home-hub.*` 标签配置服务信息
- **图标缓存**: 自动下载并缓存远程图标，检测更新
- **实时更新**: 监听 Docker 事件，服务变化即时反映
- **状态显示**: 显示服务在线/离线状态

### 1.2 技术栈

- **框架**: React Router v7 (框架模式)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **Docker**: dockerode (Node.js Docker 客户端)
- **通信**: Server-Sent Events (SSE)

---

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Host                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              home-hub Container                      │   │
│  │  ┌──────────────┐      ┌───────────────────────┐   │   │
│  │  │   React      │      │   Docker Monitor      │   │   │
│  │  │   Router v7  │◄────►│   (Node.js +          │   │   │
│  │  │   App        │      │    dockerode)         │   │   │
│  │  └──────────────┘      └───────────┬───────────┘   │   │
│  │         ▲                          │               │   │
│  │         │ SSE                      │ Docker API    │   │
│  │         ▼                          ▼               │   │
│  │  ┌──────────────────────────────────────────────┐  │   │
│  │  │         /var/run/docker.sock (mounted)       │  │   │
│  │  └──────────────────────────────────────────────┘  │   │
│  │                     ▲                               │   │
│  └─────────────────────┼───────────────────────────────┘   │
│                        │                                    │
│              ┌─────────┴──────────┐                        │
│              │  Other Containers   │                        │
│              │  (with home-hub.*   │                        │
│              │   labels)           │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 组件划分

#### 后端模块

| 模块 | 文件 | 职责 |
|------|------|------|
| Docker 监控器 | `app/lib/docker.ts` | 连接 Docker，扫描容器，监听事件 |
| 图标管理器 | `app/lib/icons.ts` | 下载、缓存、检测图标更新 |
| 服务存储 | `app/lib/store.ts` | 维护服务列表状态 |
| SSE 服务 | `app/routes/api.events.ts` | 推送实时更新到前端 |

#### 前端组件

| 组件 | 文件 | 职责 |
|------|------|------|
| 服务卡片 | `app/components/ServiceCard.tsx` | 单个服务展示 |
| 服务网格 | `app/components/ServiceGrid.tsx` | 网格布局容器 |
| 状态指示器 | `app/components/StatusIndicator.tsx` | 在线/离线状态 |
| SSE 客户端 | `app/lib/sse-client.ts` | 接收服务端推送 |

---

## 3. Docker 标签规范

### 3.1 支持的标签

| 标签 | 必填 | 默认值 | 说明 | 示例 |
|------|------|--------|------|------|
| `home-hub.name` | ✅ | - | 服务显示名称 | `Jellyfin` |
| `home-hub.url` | ❌ | - | 完整的服务 URL，设置后优先使用 | `https://jellyfin.local:8920/web` |
| `home-hub.port` | ❌ | 80 | 服务端口（url 未设置时使用） | `8096` |
| `home-hub.host` | ❌ | Docker host IP | 自定义域名/IP（url 未设置时使用） | `jellyfin.local` |
| `home-hub.icon` | ❌ | 自动生成 | 图标 URL | `https://example.com/icon.png` |
| `home-hub.category` | ❌ | "其他" | 分类分组 | `媒体` |
| `home-hub.description` | ❌ | - | 服务描述 | `家庭媒体中心` |
| `home-hub.order` | ❌ | 0 | 排序权重（数字越小越靠前） | `1` |

#### URL 构建优先级

当用户点击导航卡片时，URL 按以下优先级确定：

1. **`home-hub.url`** - 如果设置，直接使用此 URL
2. **`home-hub.host` + `home-hub.port`** - 组合构建 URL (`http://{host}:{port}`)
3. **Docker host IP + `home-hub.port`** - 默认使用 Docker 宿主机 IP

### 3.2 使用示例

#### 示例 1: 基本配置（使用 host + port）

```yaml
# docker-compose.yml
version: '3'
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    labels:
      - "home-hub.name=Jellyfin"
      - "home-hub.port=8096"
      - "home-hub.icon=https://jellyfin.org/images/icon.png"
      - "home-hub.category=媒体"
      - "home-hub.description=家庭影音服务器"
      - "home-hub.order=1"
    ports:
      - "8096:8096"
```

#### 示例 2: 使用完整 URL（适合反向代理场景）

```yaml
version: '3'
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    labels:
      - "home-hub.name=Jellyfin"
      - "home-hub.url=https://jellyfin.example.com/web"
      - "home-hub.icon=https://jellyfin.org/images/icon.png"
      - "home-hub.category=媒体"
    # 无需暴露端口，通过反向代理访问
```

#### 示例 3: HTTPS 自定义端口

```yaml
version: '3'
services:
  nextcloud:
    image: nextcloud:latest
    container_name: nextcloud
    labels:
      - "home-hub.name=Nextcloud"
      - "home-hub.url=https://cloud.local:8443"
      - "home-hub.category=工具"
```

---

## 4. 数据流设计

### 4.1 启动流程

```
1. 应用启动
   ↓
2. 连接 Docker socket
   ↓
3. 扫描所有容器
   ↓
4. 提取带 home-hub.name 标签的容器
   ↓
5. 解析标签获取服务信息
   ↓
6. 检查并下载图标
   ↓
7. 存储到服务列表
   ↓
8. 开始监听 Docker 事件
```

### 4.2 运行时更新流程

```
Docker 事件触发
   ↓
解析事件类型 (start/stop/die/create/destroy/update)
   ↓
如果是相关事件:
   ├─ 重新扫描该容器
   ├─ 更新服务信息
   ├─ 检查图标变更
   └─ 通知 SSE 客户端
   ↓
前端接收更新 → 重新渲染
```

### 4.3 图标更新检测

```
容器标签变更
   ↓
解析 home-hub.icon
   ↓
计算图标 URL 的 hash
   ↓
对比已缓存图标的 hash
   ├─ 相同: 使用现有缓存
   └─ 不同: 
      ├─ 下载新图标
      ├─ 保存到 /data/icons/{hash}.{ext}
      └─ 更新 hash 映射
```

---

## 5. API 设计

### 5.1 REST API

#### GET /api/services
返回所有服务列表

**响应:**
```json
{
  "services": [
    {
      "id": "container_id",
      "name": "Jellyfin",
      "url": "http://192.168.1.100:8096",
      "icon": "/icons/abc123.png",
      "category": "媒体",
      "description": "家庭影音服务器",
      "status": "running",
      "order": 1
    },
    {
      "id": "container_id_2",
      "name": "Nextcloud",
      "url": "https://cloud.local:8443",
      "icon": "/icons/def456.svg",
      "category": "工具",
      "description": "私有云存储",
      "status": "running",
      "order": 2
    }
  ]
}
```

#### GET /api/services/:id/health
检查单个服务健康状态

### 5.2 SSE Endpoint

#### GET /api/events
Server-Sent Events 流

**事件类型:**
- `services.update` - 服务列表更新
- `service.status` - 单个服务状态变更
- `icon.update` - 图标更新

---

## 6. 图标管理

### 6.1 存储结构

```
data/
└── icons/
    ├── abc123.png      # hash 命名的图标文件
    ├── def456.svg
    └── manifest.json   # URL → hash 映射表
```

### 6.2 更新检测算法

1. 维护 `manifest.json`: `{ "url": "hash" }`
2. 新容器/标签变更时，计算 `hash = sha256(url).slice(0, 12)`
3. 对比现有 hash:
   - 不同 → 下载新图标，更新 manifest
   - 相同 → 复用缓存
4. 提供 `/icons/:hash` 路由访问本地图标

### 6.3 支持的格式

- PNG (推荐)
- JPG/JPEG
- SVG (矢量，最佳)
- ICO

---

## 7. UI 设计

### 7.1 页面布局

```
┌─────────────────────────────────────────────────────────┐
│  Home Hub                                    [状态指示]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│   │   [图标]    │  │   [图标]    │  │   [图标]    │    │
│   │  服务名称   │  │  服务名称   │  │  服务名称   │    │
│   │  ● 在线    │  │  ● 在线    │  │  ○ 离线    │    │
│   └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│   ┌─────────────┐  ┌─────────────┐                      │
│   │   [图标]    │  │   [图标]    │                      │
│   │  服务名称   │  │  服务名称   │                      │
│   │  ● 在线    │  │  ● 在线    │                      │
│   └─────────────┘  └─────────────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 7.2 响应式设计

- 桌面端: 4-6 列网格
- 平板: 3 列网格
- 手机: 2 列网格

### 7.3 卡片设计

- 圆角矩形卡片
- 悬停效果: 轻微上浮 + 阴影加深
- 图标: 64x64px，居中
- 名称: 卡片下方，居中
- 状态点: 名称旁边，绿色/红色

---

## 8. 错误处理

### 8.1 Docker 连接失败

- 重试机制: 指数退避，最多 5 次
- 失败显示: 页面顶部错误横幅
- 降级模式: 显示缓存的服务列表（如有）

### 8.2 图标下载失败

- 使用默认图标（首字母图标）
- 记录错误日志
- 继续处理其他服务

### 8.3 服务健康检查失败

- 标记为离线状态（黄色/红色指示器）
- 不影响其他服务显示
- 可配置健康检查超时时间

---

## 9. 配置选项

### 9.1 环境变量

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket 路径 |
| `DATA_DIR` | `./data` | 数据存储目录 |
| `PORT` | `3000` | 服务端口 |
| `LABEL_PREFIX` | `home-hub` | 标签前缀 |
| `ICON_TIMEOUT` | `10000` | 图标下载超时(ms) |
| `HEALTH_CHECK_TIMEOUT` | `5000` | 健康检查超时(ms) |

### 9.2 Docker Compose 配置

```yaml
version: '3'
services:
  home-hub:
    image: home-hub:latest
    container_name: home-hub
    environment:
      - PORT=3000
      - DATA_DIR=/data
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./data:/data
    ports:
      - "3000:3000"
    restart: unless-stopped
```

---

## 10. 安全考虑

### 10.1 Docker Socket 访问

- 以只读模式挂载 (`:ro`)
- 容器内只监听事件和读取容器信息
- 不执行任何写入操作

### 10.2 图标下载安全

- 限制下载文件大小（最大 1MB）
- 验证下载内容类型（image/*）
- 使用 HTTPS 优先
- 超时机制防止挂起

### 10.3 服务 URL 安全

- 只允许内部 IP 和域名
- 可配置允许的主机名白名单

---

## 11. 性能考虑

### 11.1 启动优化

- 并行处理图标下载
- 使用 Promise.all 批量处理

### 11.2 运行时优化

- SSE 连接复用
- 防抖处理频繁事件
- 内存中的服务缓存

### 11.3 图标优化

- SVG 格式优先（矢量，体积小）
- 缓存控制头（长期缓存）
- 定期清理未使用图标

---

## 12. 扩展性

### 12.1 未来可能的功能

- [ ] 服务分组/文件夹
- [ ] 主题切换（深色/浅色）
- [ ] 搜索功能
- [ ] 服务统计（访问量）
- [ ] 多 Docker 主机支持
- [ ] 简单认证（密码保护）

### 12.2 插件系统

预留插件接口，支持自定义:
- 图标源（Iconify, Simple Icons 等）
- 健康检查方式
- 自定义卡片渲染

---

## 13. 测试策略

### 13.1 单元测试

- Docker 模块 mocking
- 图标管理逻辑
- 标签解析函数

### 13.2 集成测试

- Docker API 连接
- SSE 通信
- 端到端流程

### 13.3 手动测试清单

- [ ] 启动扫描
- [ ] 容器启动/停止事件
- [ ] 标签变更检测
- [ ] 图标下载和缓存
- [ ] 图标 URL 变更检测
- [ ] 多分类显示
- [ ] 响应式布局
- [ ] 长时间运行稳定性

---

## 14. 部署指南

### 14.1 构建

```bash
# 本地开发
npm install
npm run dev

# 生产构建
npm run build
npm start
```

### 14.2 Docker 部署

```bash
# 构建镜像
docker build -t home-hub .

# 运行
docker run -d \
  --name home-hub \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -v $(pwd)/data:/data \
  -p 3000:3000 \
  home-hub
```

### 14.3 Docker Compose 部署

```bash
docker-compose up -d
```

---

## 15. 附录

### 15.1 依赖列表

**生产依赖:**
- `react-router` - 框架核心
- `dockerode` - Docker API 客户端
- `sharp` - 图像处理（可选，用于图标优化）

**开发依赖:**
- `typescript` - 类型系统
- `tailwindcss` - CSS 框架
- `vite` - 构建工具

### 15.2 参考文档

- [React Router v7 Docs](https://reactrouter.com/)
- [Dockerode API](https://github.com/apocas/dockerode)
- [Docker Events API](https://docs.docker.com/engine/api/v1.43/#tag/System/operation/SystemEvents)

---

**文档结束**
