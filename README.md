# Home Hub 🏠

一个简洁美观的 Docker 服务导航面板，自动发现并展示你的家庭服务器上的容器服务。

[![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## ✨ 功能特点

- 🤖 **自动发现** - 自动扫描 Docker 容器，无需手动配置
- 🔄 **实时更新** - 容器状态变化即时反映，无需刷新页面
- 🏷️ **标签配置** - 通过 Docker 标签灵活配置每个服务
- 🎨 **图标缓存** - 自动下载并缓存服务图标，支持图标更新检测
- 📊 **状态显示** - 实时显示服务在线/离线状态
- 📁 **分类管理** - 按类别分组展示服务
- 🌓 **深色模式** - 支持深色主题
- 📱 **响应式设计** - 完美适配桌面和移动设备

## 🚀 快速开始

### Docker Compose（推荐）

```bash
# 克隆仓库
git clone https://github.com/mx1700/home-hub.git
cd home-hub

# 启动服务
docker-compose up -d

# 访问 http://localhost:3000
```

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:5173
```

## 🏷️ 标签配置

在 Docker 容器中添加以下标签，Home Hub 会自动发现并展示：

```yaml
services:
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    labels:
      - "home-hub.name=Jellyfin"              # 服务名称（必填）
      - "home-hub.port=8096"                   # 服务端口（默认80）
      - "home-hub.category=媒体"               # 分类
      - "home-hub.icon=https://example.com/icon.png"  # 图标URL
      - "home-hub.description=家庭影音服务器"   # 描述
      - "home-hub.order=1"                     # 排序权重
    ports:
      - "8096:8096"
```

### 支持的标签

| 标签 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `home-hub.name` | ✅ | - | 服务显示名称 |
| `home-hub.url` | ❌ | - | 完整URL，设置后优先使用 |
| `home-hub.host` | ❌ | Docker Host IP | 自定义域名/IP |
| `home-hub.port` | ❌ | 80 | 服务端口 |
| `home-hub.icon` | ❌ | 自动生成 | 图标URL |
| `home-hub.category` | ❌ | "其他" | 分类名称 |
| `home-hub.description` | ❌ | - | 服务描述 |
| `home-hub.order` | ❌ | 0 | 排序权重（数字越小越靠前）|

### URL 优先级

当点击导航时，URL 按以下优先级确定：

1. `home-hub.url` - 如果设置，直接使用
2. `home-hub.host` + `home-hub.port` - 组合构建 `http://{host}:{port}`
3. Docker Host IP + `home-hub.port` - 默认使用宿主机IP

## 🐳 部署示例

### 为现有服务添加标签

```yaml
version: '3'
services:
  # Jellyfin 媒体服务器
  jellyfin:
    image: jellyfin/jellyfin:latest
    container_name: jellyfin
    labels:
      - "home-hub.name=Jellyfin"
      - "home-hub.port=8096"
      - "home-hub.category=媒体"
      - "home-hub.icon=https://jellyfin.org/images/logo.svg"
      - "home-hub.description=家庭影音中心"
    ports:
      - "8096:8096"

  # Nextcloud 云存储
  nextcloud:
    image: nextcloud:latest
    container_name: nextcloud
    labels:
      - "home-hub.name=Nextcloud"
      - "home-hub.url=https://cloud.example.com"  # 使用反向代理URL
      - "home-hub.category=工具"
      - "home-hub.icon=https://nextcloud.com/media/logo.svg"
    # 端口可以不暴露，通过反向代理访问

  # Portainer Docker管理
  portainer:
    image: portainer/portainer-ce:latest
    container_name: portainer
    labels:
      - "home-hub.name=Portainer"
      - "home-hub.port=9000"
      - "home-hub.category=系统"
      - "home-hub.order=0"  # 排在最前面
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

## 📸 截图

![Home Hub Screenshot](docs/screenshot.png)

*服务卡片展示在线状态、图标和分类*

## 🛠️ 技术栈

- **前端**: React Router v7, TypeScript, Tailwind CSS
- **后端**: React Router v7 (Server-side Rendering)
- **Docker**: dockerode (Node.js Docker API 客户端)
- **实时通信**: Server-Sent Events (SSE)
- **构建**: Vite

## 🔧 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Docker socket 路径 |
| `DOCKER_HOST_IP` | `host.docker.internal` | Docker 宿主机IP |
| `DATA_DIR` | `./data` | 数据存储目录（图标缓存）|
| `PORT` | `3000` | 服务端口 |

## 📁 项目结构

```
home-hub/
├── app/
│   ├── components/          # React 组件
│   │   ├── ServiceCard.tsx  # 服务卡片
│   │   └── ServiceGrid.tsx  # 服务网格布局
│   ├── lib/
│   │   ├── docker.ts        # Docker API 客户端
│   │   ├── icons.ts         # 图标管理
│   │   ├── store.ts         # 状态管理
│   │   └── use-sse.ts       # SSE hook
│   ├── routes/              # API 路由
│   └── types/               # TypeScript 类型
├── data/                    # 图标缓存目录
├── Dockerfile
└── docker-compose.yml
```

## 🔐 安全说明

- Docker socket 以只读模式挂载 (`:ro`)
- 图标下载限制最大 1MB
- 图标文件类型验证 (image/*)
- 本地图标长期缓存 (1年)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

---

Made with ❤️ by [mx1700](https://github.com/mx1700)
