# GitHub Actions Release & Docker Build Design

## 概述
为 home-hub 项目添加两个 GitHub Actions 工作流，实现自动化发布 Release 和自动构建推送 Docker 镜像到 GitHub Container Registry。

## 工作流设计

### 工作流 1: Release 自动发布 (`release.yml`)

**触发条件:**
- 推送符合语义化版本格式的 tag (如 `v1.0.0`, `v0.5.2-beta.1`)
- Tag 格式: `v*` 或 `V*` 开头

**执行步骤:**
1. 检出代码 (带完整 git 历史以生成 changelog)
2. 创建 GitHub Release
3. 自动生成 release notes (基于 PR 和 commits)

**输出:**
- GitHub Release 页面，包含版本说明和源码压缩包

### 工作流 2: Docker 镜像构建与发布 (`docker.yml`)

**触发条件:**
- 推送符合语义化版本格式的 tag
- 允许手动触发 (workflow_dispatch)

**执行步骤:**
1. 检出代码
2. 设置 Docker Buildx
3. 登录 GitHub Container Registry (GHCR)
4. 构建并推送 Docker 镜像

**镜像标签策略:**
- `ghcr.io/<owner>/home-hub:<tag>` (如 `ghcr.io/owner/home-hub:v1.0.0`)
- `ghcr.io/<owner>/home-hub:latest`

**权限要求:**
- `packages: write` - 推送镜像到 GHCR
- `contents: read` - 读取仓库内容

## 配置要求

### 仓库设置
- 确保 Actions 有写入 packages 权限
- 不需要额外 secrets (使用默认 GITHUB_TOKEN)

### 文件位置
```
.github/workflows/
├── release.yml
└── docker.yml
```

## 安全考虑
- 使用 GitHub 提供的 GITHUB_TOKEN，无需额外配置 secrets
- 限制工作流权限范围 (最小权限原则)
- 只响应 tag 推送，避免意外触发

## 验证方式
1. 推送一个测试 tag: `git tag v0.0.1-test && git push origin v0.0.1-test`
2. 检查 Actions 运行状态
3. 验证 Release 页面是否创建
4. 验证 Docker 镜像是否推送到 GHCR (Packages 页面)
