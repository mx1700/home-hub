# GitHub Actions Release & Docker Build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use @superpowers:subagent-driven-development (recommended) or @superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建两个 GitHub Actions 工作流，实现推送 tag 时自动发布 GitHub Release 和自动构建推送 Docker 镜像到 GHCR。

**Architecture:** 使用 GitHub Actions workflow 文件定义 CI/CD 流程，利用 GITHUB_TOKEN 进行身份验证，无需额外 secrets。

**Tech Stack:** GitHub Actions, Docker, GitHub Container Registry (GHCR)

---

## File Structure

```
.github/workflows/
├── release.yml    # 自动发布 Release 工作流
└── docker.yml     # Docker 镜像构建与发布工作流
```

---

### Task 1: 创建 Release 工作流

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: 创建 workflow 目录结构**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: 编写 release.yml 工作流**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'
      - 'V*'

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

- [ ] **Step 3: 提交 release.yml**

```bash
git add .github/workflows/release.yml
git commit -m "ci: add GitHub Actions workflow for auto-release"
```

---

### Task 2: 创建 Docker 构建工作流

**Files:**
- Create: `.github/workflows/docker.yml`

- [ ] **Step 1: 编写 docker.yml 工作流**

```yaml
name: Build and Push Docker Image

on:
  push:
    tags:
      - 'v*'
      - 'V*'
  workflow_dispatch:

permissions:
  contents: read
  packages: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=ref,event=tag
            type=raw,value=latest

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

- [ ] **Step 2: 提交 docker.yml**

```bash
git add .github/workflows/docker.yml
git commit -m "ci: add GitHub Actions workflow for Docker build and push"
```

---

### Task 3: 验证配置

- [ ] **Step 1: 检查 YAML 语法**

```bash
# 如果安装了 yamllint 可以检查
yamllint .github/workflows/
```

- [ ] **Step 2: 本地验证文件存在和格式**

```bash
ls -la .github/workflows/
cat .github/workflows/release.yml
cat .github/workflows/docker.yml
```

- [ ] **Step 3: 最终提交**

```bash
git push origin $(git branch --show-current)
```

---

## 测试说明

### 测试方式

1. **本地测试 (可选):**
   ```bash
   # 安装 act 工具进行本地测试
   act -j release
   act -j build
   ```

2. **实际测试:**
   ```bash
   # 推送一个测试 tag
   git tag v0.0.1-test
   git push origin v0.0.1-test
   
   # 观察 Actions 运行状态
   # 检查 GitHub Releases 页面
   # 检查 GitHub Packages 页面
   ```

### 预期结果

- `release` 工作流成功运行，创建新的 GitHub Release
- `build` 工作流成功运行，推送两个标签的镜像：
  - `ghcr.io/<owner>/home-hub:v0.0.1-test`
  - `ghcr.io/<owner>/home-hub:latest`

---

## 注意事项

1. **权限配置:** 确保仓库 Settings > Actions > General > Workflow permissions 设置为 "Read and write permissions"
2. **Package 可见性:** 首次推送后，需要在 Packages 页面设置镜像为公开或私有
3. **Tag 格式:** 必须使用 `v` 或 `V` 开头的 tag (如 `v1.0.0`)
