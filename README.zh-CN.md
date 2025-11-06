<p align="center">
  <img src="./favico.ico" alt="oss-uploader Logo" width="280" />
</p>

<h1 align="center"><b>oss-uploader</b></h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@atomfe/oss-uploader"><img src="https://img.shields.io/npm/v/@atomfe/oss-uploader?color=42b883&label=npm&logo=npm" alt="npm"></a>
  <a href="https://www.npmjs.com/package/@atomfe/oss-uploader"><img src="https://img.shields.io/npm/dy/@atomfe/oss-uploader?label=downloads&logo=npm" alt="downloads"></a>
  <a href="https://github.com/lorainwings/aliyun-oss-uploader/blob/main/LICENSE"><img src="https://img.shields.io/github/license/lorainwings/aliyun-oss-uploader?color=blue&label=license&logo=open-source-initiative" alt="license"></a>
  <a href="https://github.com/lorainwings/aliyun-oss-uploader/actions"><img src="https://img.shields.io/github/actions/workflow/status/lorainwings/aliyun-oss-uploader/ci.yml?branch=main&label=CI&logo=github" alt="CI"></a>
  <a href="https://codecov.io/gh/lorainwings/aliyun-oss-uploader"><img src="https://codecov.io/gh/lorainwings/aliyun-oss-uploader/branch/main/graph/badge.svg" alt="Coverage"></a>
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/ESM%2FCJS-双格式模块-yellow?logo=javascript&logoColor=white" alt="Dual Module">
</p>

<p align="center">
  <strong>🚀 强大的阿里云 OSS 上传器 🚀</strong>
</p>

<p align="center">
  <em>简单、快速、可靠 - 完美适配你的部署工作流</em>
</p>

<p align="center">
  <a href="./README.md">English</a> | 简体中文
</p>

---

## ✨ 特性

- 🚀 **简单易用** - 一条命令完成文件上传
- 📦 **批量上传** - 支持目录递归上传
- 🔐 **安全可靠** - 多种配置文件格式，安全存储凭证
- 🎯 **灵活配置** - 支持 Glob 模式文件过滤
- 📊 **实时进度** - 实时显示上传进度和统计信息
- 🗺️ **映射文件** - 自动生成本地文件与 OSS 地址的映射
- 🔑 **内容哈希** - 自动添加 8 位内容哈希
- 🛠️ **功能完整** - 上传、列表、删除等完整操作
- 💪 **类型安全** - 使用 TypeScript 编写，完整的类型支持
- ⚡ **现代化** - 双格式模块（ESM/CJS），使用最新的工具链
- 🔄 **兼容性好** - 同时支持 CommonJS 和 ES Module 项目

## 📦 安装

```bash
npm install -g @atomfe/oss-uploader
# 或
pnpm add -g @atomfe/oss-uploader
# 或
yarn global add @atomfe/oss-uploader
```

## 🚀 快速开始

### 方式 1：JSON 配置

```bash
# 1. 初始化配置（JSON 格式）
oss-uploader init

# 2. 编辑 .ossrc.json 填入你的凭证
{
  "region": "YOUR_REGION",
  "accessKeyId": "YOUR_ACCESS_KEY_ID",
  "accessKeySecret": "YOUR_ACCESS_KEY_SECRET",
  "bucket": "YOUR_BUCKET_NAME"
}

# 3. 上传文件
oss-uploader upload ./file.txt
oss-uploader upload ./dist -t static/
```

### 方式 2：JavaScript 配置（推荐）

```bash
# 1. 初始化 JavaScript 配置
oss-uploader init -o oss.config.js

# 2. 设置环境变量或编辑 oss.config.js
export OSS_REGION="oss-cn-hangzhou"
export OSS_ACCESS_KEY_ID="your-access-key-id"
export OSS_ACCESS_KEY_SECRET="your-access-key-secret"
export OSS_BUCKET="your-bucket-name"

# 3. 上传文件
oss-uploader upload ./file.txt
oss-uploader upload ./dist -t static/
```

## 📖 使用说明

### 命令列表

```bash
# 上传文件或目录（支持多个文件路径）
oss-uploader upload <sources...> [options]

# 列出 OSS bucket 中的文件
oss-uploader list [prefix]

# 从 OSS 删除文件
oss-uploader delete <path>

# 显示 bucket 信息
oss-uploader info

# 创建示例配置
oss-uploader init [选项]

# init 命令选项：
#   -o, --output <path>  配置文件输出路径（默认：.ossrc.json）
#   -t, --type <type>    配置文件类型：json 或 js
```

### 上传选项

| 选项 | 说明 |
|------|------|
| `-t, --target <path>` | OSS bucket 中的目标路径 |
| `-c, --config <path>` | 配置文件路径 |
| `-r, --recursive` | 递归上传目录（默认：true） |
| `-o, --overwrite` | 覆盖已存在的文件（默认：true） |
| `-i, --include <patterns...>` | 包含的文件模式（glob） |
| `-e, --exclude <patterns...>` | 排除的文件模式（glob） |
| `-v, --verbose` | 显示详细输出 |
| `-m, --mapping [path]` | 生成上传映射文件（默认：.oss-uploader-mapping.json） |
| `--no-mapping` | 不生成上传映射文件 |
| `-h, --content-hash` | 添加内容哈希到文件名（默认：true） |
| `--no-content-hash` | 不添加内容哈希到文件名 |

### 使用示例

```bash
# 上传单个文件
oss-uploader upload ./image.png

# 上传多个文件（批量上传）
oss-uploader upload ./file1.js ./file2.css ./image.png

# 上传多个文件到指定目录
oss-uploader upload ./image1.png ./image2.jpg ./logo.svg -t images/2024/

# 上传到指定目录
oss-uploader upload ./image.png -t images/2024/

# 使用文件模式上传目录
oss-uploader upload ./dist -i "**/*.js" "**/*.css"

# 排除特定文件
oss-uploader upload ./dist -e "**/*.map" "**/test/**"

# 详细模式
oss-uploader upload ./dist -v

# 生成自定义路径的映射文件
oss-uploader upload ./dist -m ./upload-map.json

# 不生成映射文件
oss-uploader upload ./dist --no-mapping

# 使用内容哈希上传（默认行为）
oss-uploader upload ./dist
# 结果: file.js → file.a1b2c3d4.js

# 不使用内容哈希上传
oss-uploader upload ./dist --no-content-hash
# 结果: file.js → file.js

# 混合上传文件和目录（批量上传）
oss-uploader upload ./src/file1.js ./src/file2.css ./assets
```

## 📊 进度展示

工具会在上传过程中显示实时进度，支持两种模式：

### 默认模式（进度条）

批量上传时，会显示一个美观的进度条，包含：

- ✅ 上传进度百分比
- 📈 已上传/总文件数
- 📄 当前正在上传的文件名

```
Upload Progress |████████████████████░░░░░░| 75% | 15/20 Files | src/components/Button.tsx
```

### 详细模式（-v）

使用 `-v` 或 `--verbose` 选项可以查看每个文件的详细上传信息：

```bash
oss-uploader upload ./dist -v
```

显示输出：

```
✓ Uploaded: src/index.js → static/index.js (24.5 KB)
✓ Uploaded: src/styles.css → static/styles.css (12.3 KB)
...
```

## 🔐 内容哈希功能

默认情况下，上传器会为文件名添加 8 位内容哈希（类似于 webpack 的 chunkhash），提供缓存破坏能力。

### 工作原理

工具会根据文件内容生成 MD5 哈希，并将前 8 个字符添加到文件扩展名之前：

```
原文件名:  app.js
上传后:   app.a1b2c3d4.js

原文件名:  style.min.css
上传后:   style.min.e5f6g7h8.css
```

### 优势

- ✅ **缓存破坏** - 文件内容变化时自动失效浏览器缓存
- 🔄 **版本控制** - 相同内容始终生成相同的哈希
- 🚀 **CDN 友好** - 完美适配 CDN 缓存管理
- 📦 **构建流程** - 与现代构建工具无缝集成

### 使用方法

```bash
# 默认：启用内容哈希
oss-uploader upload ./dist
# app.js → app.a1b2c3d4.js

# 禁用内容哈希
oss-uploader upload ./dist --no-content-hash
# app.js → app.js

# 使用编程式 API
import { OSSUploader } from '@atomfe/oss-uploader';

const uploader = new OSSUploader(config);

// 启用内容哈希（默认）
await uploader.upload({
  source: './dist',
  target: 'static/',
  contentHash: true  // 默认值
});

// 禁用内容哈希
await uploader.upload({
  source: './dist',
  target: 'static/',
  contentHash: false
});
```

### 使用场景

- 🌐 **静态站点部署** - 确保访客获取最新版本
- 📱 **单页应用** - 可靠的资源更新机制
- 🔧 **微服务架构** - 跨服务的一致版本管理
- 📦 **资源分发** - 追踪不同版本的发布资源

## 🗺️ 上传映射文件

每次上传完成后，工具会自动在当前目录生成一个 `.oss-uploader-mapping.json` 文件，包含所有上传文件的详细信息：

```json
{
  "uploadTime": "2025-10-18T10:30:00.000Z",
  "bucket": "my-bucket",
  "region": "YOUR_REGION",
  "totalFiles": 10,
  "totalSize": 1024000,
  "files": [
    {
      "localPath": "/path/to/local/file.js",
      "remotePath": "static/file.js",
      "url": "https://my-bucket.YOUR_REGION.aliyuncs.com/static/file.js",
      "size": 1024,
      "uploadTime": "2025-10-18T10:30:00.000Z"
    }
  ]
}
```

### 映射文件用途

- 📝 **记录备份** - 保存每次上传的完整记录
- 🔗 **快速访问** - 获取所有上传文件的 URL
- 📊 **统计分析** - 分析上传的文件数量和大小
- 🔄 **CI/CD 集成** - 在构建流程中使用映射信息
- 📱 **CDN 配置** - 方便配置 CDN 缓存规则

## ⚙️ 配置

工具支持多种配置来源：

**优先级顺序：** 优先使用配置文件，无配置文件时使用环境变量

> **注意：** 如果存在配置文件，将优先使用配置文件。只有在找不到配置文件时才会使用环境变量。

### 配置来源

1. **配置文件**（按以下顺序搜索）：
   - `.ossrc` / `.ossrc.json`
   - `.ossrc.yaml` / `.ossrc.yml`
   - `oss.config.js` / `oss.config.json`
   - `package.json` 中的 `oss` 字段

2. **环境变量**：
   - `OSS_REGION`
   - `OSS_ACCESS_KEY_ID`
   - `OSS_ACCESS_KEY_SECRET`
   - `OSS_BUCKET`
   - `OSS_ENDPOINT`（可选）
   - `OSS_INTERNAL`（可选，`true`/`false`）
   - `OSS_SECURE`（可选，`true`/`false`）
   - `OSS_TIMEOUT`（可选，单位毫秒）

### 配置字段

| 字段 | 必需 | 说明 |
|------|------|------|
| `region` | ✅ | OSS 地域（如：`oss-cn-hangzhou`） |
| `accessKeyId` | ✅ | AccessKey ID |
| `accessKeySecret` | ✅ | AccessKey Secret |
| `bucket` | ✅ | Bucket 名称 |
| `endpoint` | ❌ | 自定义 endpoint |
| `internal` | ❌ | 是否使用内网 |
| `secure` | ❌ | 是否使用 HTTPS（默认：true） |
| `timeout` | ❌ | 超时时间（毫秒，默认：60000） |

### 示例：`.ossrc.json`

```json
{
  "region": "YOUR_REGION",
  "accessKeyId": "YOUR_ACCESS_KEY_ID",
  "accessKeySecret": "YOUR_ACCESS_KEY_SECRET",
  "bucket": "my-bucket"
}
```

### 示例：`oss.config.js`

使用 `oss-uploader init -o oss.config.js` 生成 JavaScript 配置

**ESM 格式（带后备值）：**

```javascript
export default {
  region: process.env.OSS_REGION || 'YOUR_REGION',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'YOUR_ACCESS_KEY_SECRET',
  bucket: process.env.OSS_BUCKET || 'YOUR_BUCKET_NAME',
  
  // 可选字段
  // endpoint: process.env.OSS_ENDPOINT,
  // internal: process.env.OSS_INTERNAL === 'true',
  secure: true,
  timeout: 60000,
};
```

**CommonJS 格式：**

```javascript
module.exports = {
  region: process.env.OSS_REGION || 'YOUR_REGION',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'YOUR_ACCESS_KEY_SECRET',
  bucket: process.env.OSS_BUCKET || 'YOUR_BUCKET_NAME',
  secure: true,
  timeout: 60000,
};
```

### 示例：仅使用环境变量

```bash
# 设置环境变量
export OSS_REGION="YOUR_REGION"
export OSS_ACCESS_KEY_ID="你的-access-key-id"
export OSS_ACCESS_KEY_SECRET="你的-access-key-secret"
export OSS_BUCKET="my-bucket"

# 可选的环境变量
export OSS_SECURE="true"
export OSS_TIMEOUT="60000"

# 现在可以不使用配置文件直接使用 CLI
oss-uploader upload ./dist -t static/

# 注意：如果存在配置文件，将优先使用配置文件而不是环境变量
```

## 🔧 编程使用

### ESM (ES 模块)

```typescript
import { OSSUploader, loadConfig } from 'oss-uploader';

const config = await loadConfig();
const uploader = new OSSUploader(config);

const results = await uploader.upload({
  source: './dist',
  target: 'static/',
  recursive: true,
  overwrite: true,
  verbose: true,
  generateMapping: true,
});

console.log('上传结果:', results);
```

### CommonJS

```javascript
const { OSSUploader, loadConfig } = require('oss-uploader');

(async () => {
  const config = await loadConfig();
  const uploader = new OSSUploader(config);

  const results = await uploader.upload({
    source: './dist',
    target: 'static/',
    recursive: true,
    overwrite: true,
    verbose: true,
    generateMapping: true,
  });

  console.log('上传结果:', results);
})();
```

## 🎯 使用场景

### 前端部署

```bash
npm run build
oss-uploader upload ./dist -t static/my-app/
```

### CI/CD 集成

```yaml
# GitHub Actions - 使用环境变量（推荐）
- name: 上传到 OSS
  env:
    OSS_REGION: ${{ secrets.OSS_REGION }}
    OSS_ACCESS_KEY_ID: ${{ secrets.OSS_ACCESS_KEY_ID }}
    OSS_ACCESS_KEY_SECRET: ${{ secrets.OSS_ACCESS_KEY_SECRET }}
    OSS_BUCKET: ${{ secrets.OSS_BUCKET }}
  run: |
    npm install -g @atomfe/oss-uploader
    oss-uploader upload ./dist -t static/

# 备选方案：使用配置文件
- name: 上传到 OSS
  run: |
    npm install -g @atomfe/oss-uploader
    echo '{"region":"${{ secrets.OSS_REGION }}","accessKeyId":"${{ secrets.OSS_ACCESS_KEY_ID }}","accessKeySecret":"${{ secrets.OSS_ACCESS_KEY_SECRET }}","bucket":"${{ secrets.OSS_BUCKET }}"}' > .ossrc.json
    oss-uploader upload ./dist -t static/
```

### Package.json 脚本

```json
{
  "scripts": {
    "deploy": "npm run build && oss-uploader upload ./dist -t static/"
  }
}
```

### 使用映射文件

```javascript
// 读取映射文件
import mapping from './.oss-uploader-mapping.json' assert { type: 'json' };

// 获取所有上传的 URL
const urls = mapping.files.map(f => f.url);

// 更新 HTML 中的资源引用
const updateHTML = html => {
  mapping.files.forEach(file => {
    html = html.replace(
      new RegExp(file.localPath, 'g'),
      file.url
    );
  });
  return html;
};
```

## 🔐 安全建议

- ✅ 将 `.ossrc.json` 添加到 `.gitignore`
- ✅ 使用 RAM 子账号而非主账号
- ✅ 在 CI/CD 中使用环境变量
- ✅ 定期轮换 AccessKey
- ❌ 永远不要在代码中硬编码凭证

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

如需报告 bug 或请求新功能，请创建 issue。

## 📝 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建
pnpm run build

# 测试
pnpm run test
pnpm run test:coverage

# 代码检查与格式化
pnpm run lint
pnpm run format
```

## 🆕 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新历史。

## 📄 开源协议

[MIT](./LICENSE) © 2025

## 🌟 核心特性

### 现代化技术栈

- ✅ **双模块格式** - 同时支持 ESM 和 CommonJS
- ✅ **TypeScript 5.7** - 完整的类型安全
- ✅ **tsup 构建** - 基于 esbuild 的超快构建
- ✅ **Vitest 测试** - 现代化的测试框架
- ✅ **npm Provenance** - 供应链安全保障

### 开发体验

- 🔥 **快速构建** - 0.05s 超快构建速度
- 🎨 **代码质量** - ESLint + Prettier
- 📊 **测试覆盖** - 单元测试 + 覆盖率报告
- 🔄 **自动发布** - Changesets 自动化版本管理
- 📚 **完整文档** - 中英文双语文档

## 💡 提示与技巧

### 1. 使用环境变量

```bash
export OSS_ACCESS_KEY_ID="your-key"
export OSS_ACCESS_KEY_SECRET="your-secret"
export OSS_BUCKET="your-bucket"
export OSS_REGION="YOUR_REGION"
```

### 2. 批量处理映射文件

```bash
# 合并多个映射文件
cat .oss-uploader-mapping-*.json | jq -s 'map(.files) | add' > all-uploads.json
```

### 3. 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh

# 构建项目
npm run build

# 上传到 OSS
oss-uploader upload ./dist -t "static/v$(date +%Y%m%d)/" -v

# 读取映射文件并发送通知
node -e "
const mapping = require('./.oss-uploader-mapping.json');
console.log(\`✅ 上传完成！共 \${mapping.totalFiles} 个文件\`);
console.log(\`📦 总大小：\${(mapping.totalSize / 1024 / 1024).toFixed(2)} MB\`);
"
```

## 🔗 相关链接

- [阿里云 OSS 文档](https://help.aliyun.com/product/31815.html)
- [GitHub 仓库](https://github.com/lorainwings/aliyun-oss-uploader)
- [npm 包](https://www.npmjs.com/package/@atomfe/oss-uploader)
- [问题反馈](https://github.com/lorainwings/aliyun-oss-uploader/issues)

---

<p align="center">
  用 ❤️ 制作 by <a href="https://github.com/lorainwings">lorainwings</a>
</p>
