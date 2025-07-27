# GitHub Actions Docker 构建工作流配置指南

## 概述

本项目已配置了自动化的Docker镜像构建和推送工作流，支持多平台构建（amd64和arm64）并推送到GitHub Container Registry (GHCR)。镜像将自动设置为公开可见。

## 工作流特性

### 触发条件
- **推送到主分支**: 当代码推送到`master`或`main`分支时自动触发
- **标签推送**: 当创建版本标签（如`v1.0.0`）时自动触发  
- **Pull Request**: 仅构建但不推送镜像，用于验证构建过程
- **手动触发**: 支持在GitHub界面手动触发工作流

### 构建特性
- **多平台支持**: 自动构建Linux/AMD64和Linux/ARM64架构的镜像
- **智能标签管理**: 根据分支和标签自动生成合适的镜像标签
- **缓存优化**: 使用Docker layer缓存加速构建过程
- **推送到GHCR**: 统一推送到GitHub Container Registry
- **公开镜像**: 自动设置镜像为公开可见
- **详细注释**: 工作流文件包含完整的中文注释说明

## 标签策略

工作流会根据不同情况自动生成标签：

| 触发条件 | 生成的标签示例 |
|---------|-------------|
| 推送到main/master分支 | `latest` |
| 推送到其他分支 | `分支名` |
| 创建版本标签 | `v1.0.0`, `1.0.0`, `1.0`, `1` |
| Pull Request | `pr-123` |

## 配置要求

### 权限设置

工作流使用内置的`GITHUB_TOKEN`，需要以下权限：
- **contents: read** - 读取仓库代码
- **packages: write** - 写入GitHub Packages (GHCR)

这些权限在工作流文件中已自动配置，无需手动设置。

### 无需额外Secrets

由于只使用GitHub Container Registry，无需配置额外的Secrets：
- ✅ 使用内置的`GITHUB_TOKEN`进行认证
- ✅ 自动使用`github.actor`作为用户名
- ✅ 权限已在工作流中正确配置

## 使用说明

### 自动构建

推送代码到仓库时会自动触发构建：

```bash
# 推送到主分支（生成latest标签）
git push origin main

# 创建并推送版本标签
git tag v1.0.0
git push origin v1.0.0
```

### 手动触发

1. 在GitHub仓库页面点击`Actions`标签
2. 选择`Build and Push Docker Image`工作流
3. 点击`Run workflow`按钮
4. 选择要构建的分支并点击运行

### 构建状态查看

- 在仓库主页可以看到构建状态徽章
- 在`Actions`标签下可以查看详细的构建日志
- 构建完成后可以在`Packages`标签下看到推送的镜像

## 镜像使用

### GitHub Container Registry镜像

```bash
# 拉取最新版本
docker pull ghcr.io/OWNER/REPO:latest

# 拉取特定版本  
docker pull ghcr.io/OWNER/REPO:v1.0.0

# 拉取特定分支版本
docker pull ghcr.io/OWNER/REPO:feature-branch
```

### 镜像访问

镜像设置为**公开访问**，无需认证即可拉取：
- ✅ 任何人都可以拉取镜像
- ✅ 不需要登录GitHub
- ✅ 支持匿名访问

## 公开镜像设置

### 自动设置

工作流会自动尝试将镜像设置为公开：
- 使用GitHub CLI API设置包可见性
- 同时支持组织和个人仓库
- 如果自动设置失败，会显示警告信息

### 手动设置（备选方案）

如果自动设置失败，可以手动设置：

1. **进入包页面**
   - 访问仓库的`Packages`标签
   - 点击对应的容器镜像包

2. **修改可见性**
   - 点击`Package settings`
   - 在`Danger Zone`中找到`Change package visibility`
   - 选择`Public`并确认

3. **验证设置**
   - 确认包页面显示`Public`标识
   - 测试匿名拉取镜像

## 工作流详解

### 工作流步骤

1. **检出代码** - 下载仓库代码和子模块
2. **设置QEMU** - 配置多架构模拟器
3. **设置Buildx** - 配置Docker扩展构建器
4. **提取元数据** - 自动生成镜像标签和标签
5. **配置缓存** - 设置Docker层缓存
6. **登录GHCR** - 使用GitHub令牌认证
7. **构建推送** - 多平台构建并推送镜像
8. **更新缓存** - 更新构建缓存
9. **输出信息** - 显示镜像摘要和标签
10. **设置公开** - 自动设置镜像为公开

### 注释说明

工作流文件包含详细的中文注释：
- **每个步骤的作用说明**
- **参数和配置的详细解释**
- **触发条件和逻辑说明**
- **缓存和优化策略说明**

## 故障排除

### 常见问题

1. **构建失败: 权限错误**
   - 检查仓库的Actions权限设置
   - 确保工作流有`packages: write`权限

2. **无法设置为公开**
   - 检查仓库是否有足够的权限
   - 手动在包设置页面修改可见性

3. **多平台构建失败**
   - 检查Dockerfile是否支持多架构
   - 确保基础镜像支持目标平台

### 调试技巧

- 查看Actions页面的详细日志
- 使用`workflow_dispatch`手动触发测试
- 先在Pull Request中测试构建过程
- 查看每个步骤的注释了解其作用

## 自定义配置

如需修改工作流配置，编辑`.github/workflows/docker-image.yml`文件：

### 常见自定义

```yaml
# 修改触发分支
branches:
  - develop
  - release/*

# 添加更多标签规则
tags: |
  type=ref,event=branch
  type=semver,pattern={{version}}
  type=raw,value=nightly,enable={{is_default_branch}}

# 修改支持的平台
platforms: linux/amd64,linux/arm64,linux/arm/v7
```

## 安全注意事项

- ✅ 使用GitHub内置令牌，安全性高
- ✅ 权限最小化原则，只授予必要权限
- ✅ 公开镜像不包含敏感信息
- ✅ 构建过程完全透明，可审计

## 镜像信息

构建的镜像将包含以下标签：
- **构建时间**: 镜像创建时间
- **源代码版本**: Git提交哈希
- **构建分支**: 源代码分支信息
- **版本信息**: 从Git标签提取的版本号 