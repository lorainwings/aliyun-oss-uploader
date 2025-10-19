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
  <img src="https://img.shields.io/badge/ESM%2FCJS-Dual%20Module-yellow?logo=javascript&logoColor=white" alt="Dual Module">
</p>

<p align="center">
  <strong>🚀 A powerful OSS uploader for uploading files to Aliyun OSS 🚀</strong>
</p>

<p align="center">
  <em>Simple, Fast, and Reliable - Perfect for your deployment workflow</em>
</p>

<p align="center">
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

---

## ✨ Features

- 🚀 **Simple** - One command to upload files
- 📦 **Batch Upload** - Support directory recursive upload
- 🔐 **Secure** - Multiple config file formats, safe credential storage
- 🎯 **Flexible** - Glob pattern file filtering
- 📊 **Progress** - Real-time upload progress and statistics
- 🗺️ **Mapping File** - Auto-generate local-to-OSS URL mapping
- 🛠️ **Complete** - Upload, list, delete, and more operations
- 💪 **TypeScript** - Written in TypeScript with full type safety
- ⚡ **Modern** - Dual format (ESM/CJS) with latest toolchain
- 🔄 **Compatible** - Works in both CommonJS and ES Module projects

## 📦 Installation

```bash
npm install -g @atomfe/oss-uploader
# or
pnpm add -g @atomfe/oss-uploader
# or
yarn global add @atomfe/oss-uploader
```

## 🚀 Quick Start

### Option 1: JSON Configuration

```bash
# 1. Initialize configuration (JSON)
oss-uploader init

# 2. Edit .ossrc.json with your credentials
{
  "region": "YOUR_REGION",
  "accessKeyId": "YOUR_ACCESS_KEY_ID",
  "accessKeySecret": "YOUR_ACCESS_KEY_SECRET",
  "bucket": "YOUR_BUCKET_NAME"
}

# 3. Upload files
oss-uploader upload ./file.txt
oss-uploader upload ./dist -t static/
```

### Option 2: JavaScript Configuration (Recommended)

```bash
# 1. Initialize JavaScript configuration
oss-uploader init -o oss.config.js

# 2. Set environment variables or edit oss.config.js
export OSS_REGION="oss-cn-hangzhou"
export OSS_ACCESS_KEY_ID="your-access-key-id"
export OSS_ACCESS_KEY_SECRET="your-access-key-secret"
export OSS_BUCKET="your-bucket-name"

# 3. Upload files
oss-uploader upload ./file.txt
oss-uploader upload ./dist -t static/
```

## 📖 Usage

### Commands

```bash
# Upload file or directory
oss-uploader upload <source> [options]

# List files in OSS bucket
oss-uploader list [prefix]

# Delete file from OSS
oss-uploader delete <path>

# Show bucket information
oss-uploader info

# Create sample configuration
oss-uploader init [options]

# Options for init command:
#   -o, --output <path>  Output path for configuration file (default: .ossrc.json)
#   -t, --type <type>    Configuration file type: json or js
```

### Upload Options

| Option | Description |
|--------|-------------|
| `-t, --target <path>` | Target path in OSS bucket |
| `-c, --config <path>` | Configuration file path |
| `-r, --recursive` | Upload directory recursively (default: true) |
| `-o, --overwrite` | Overwrite existing files (default: true) |
| `-i, --include <patterns...>` | Include file patterns (glob) |
| `-e, --exclude <patterns...>` | Exclude file patterns (glob) |
| `-v, --verbose` | Show verbose output |
| `-m, --mapping [path]` | Generate upload mapping file (default: .oss-uploader-mapping.json) |
| `--no-mapping` | Do not generate upload mapping file |

### Examples

```bash
# Upload single file
oss-uploader upload ./image.png

# Upload to specific directory
oss-uploader upload ./image.png -t images/2024/

# Upload directory with patterns
oss-uploader upload ./dist -i "**/*.js" "**/*.css"

# Exclude files
oss-uploader upload ./dist -e "**/*.map" "**/test/**"

# Verbose mode
oss-uploader upload ./dist -v

# Generate custom mapping file
oss-uploader upload ./dist -m ./upload-map.json

# Don't generate mapping file
oss-uploader upload ./dist --no-mapping
```

## 📊 Progress Display

The tool displays real-time progress during uploads with two modes:

### Default Mode (Progress Bar)

For batch uploads, a beautiful progress bar is displayed showing:

- ✅ Upload progress percentage
- 📈 Completed/Total file count
- 📄 Current file being uploaded

```
Upload Progress |████████████████████░░░░░░| 75% | 15/20 Files | src/components/Button.tsx
```

### Verbose Mode (-v)

Use `-v` or `--verbose` option to see detailed upload information for each file:

```bash
oss-uploader upload ./dist -v
```

Sample output:

```
✓ Uploaded: src/index.js → static/index.js (24.5 KB)
✓ Uploaded: src/styles.css → static/styles.css (12.3 KB)
...
```

## 🗺️ Upload Mapping File

After each upload, the tool automatically generates a `.oss-uploader-mapping.json` file in the current directory with detailed information about all uploaded files:

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

### Use Cases

- 📝 **Record Keeping** - Keep complete records of each upload
- 🔗 **Quick Access** - Get URLs for all uploaded files
- 📊 **Analytics** - Analyze upload statistics
- 🔄 **CI/CD Integration** - Use mapping info in build pipelines
- 📱 **CDN Configuration** - Configure CDN cache rules easily

## ⚙️ Configuration

The tool supports multiple configuration sources:

**Priority Order:** Config file first, fallback to Environment variables

> **Note:** If a config file exists, it will be used exclusively. Environment variables are only used when no config file is found.

### Configuration Sources

1. **Config Files** (searched in order):
   - `.ossrc` / `.ossrc.json`
   - `.ossrc.yaml` / `.ossrc.yml`
   - `oss.config.js` / `oss.config.json`
   - `oss` field in `package.json`

2. **Environment Variables**:
   - `OSS_REGION`
   - `OSS_ACCESS_KEY_ID`
   - `OSS_ACCESS_KEY_SECRET`
   - `OSS_BUCKET`
   - `OSS_ENDPOINT` (optional)
   - `OSS_INTERNAL` (optional, `true`/`false`)
   - `OSS_SECURE` (optional, `true`/`false`)
   - `OSS_TIMEOUT` (optional, in milliseconds)

### Configuration Fields

| Field | Required | Description |
|-------|----------|-------------|
| `region` | ✅ | OSS region (e.g., `oss-cn-hangzhou`) |
| `accessKeyId` | ✅ | AccessKey ID |
| `accessKeySecret` | ✅ | AccessKey Secret |
| `bucket` | ✅ | Bucket name |
| `endpoint` | ❌ | Custom endpoint |
| `internal` | ❌ | Use internal network |
| `secure` | ❌ | Use HTTPS (default: true) |
| `timeout` | ❌ | Timeout in ms (default: 60000) |

### Example: `.ossrc.json`

```json
{
  "region": "YOUR_REGION",
  "accessKeyId": "YOUR_ACCESS_KEY_ID",
  "accessKeySecret": "YOUR_ACCESS_KEY_SECRET",
  "bucket": "my-bucket"
}
```

### Example: `oss.config.js`

Generate JavaScript config with `oss-uploader init -o oss.config.js`

**ESM format (with fallback values):**

```javascript
export default {
  region: process.env.OSS_REGION || 'YOUR_REGION',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || 'YOUR_ACCESS_KEY_ID',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || 'YOUR_ACCESS_KEY_SECRET',
  bucket: process.env.OSS_BUCKET || 'YOUR_BUCKET_NAME',
  
  // Optional fields
  // endpoint: process.env.OSS_ENDPOINT,
  // internal: process.env.OSS_INTERNAL === 'true',
  secure: true,
  timeout: 60000,
};
```

**CommonJS format:**

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

### Example: Using Environment Variables Only

```bash
# Set environment variables
export OSS_REGION="YOUR_REGION"
export OSS_ACCESS_KEY_ID="your-access-key-id"
export OSS_ACCESS_KEY_SECRET="your-access-key-secret"
export OSS_BUCKET="my-bucket"

# Optional environment variables
export OSS_SECURE="true"
export OSS_TIMEOUT="60000"

# Now you can use the CLI without a config file
oss-uploader upload ./dist -t static/

# Note: If a config file exists, it will be used instead of environment variables
```

## 🔧 Programmatic Usage

### ESM (ES Modules)

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

console.log('Upload results:', results);
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

  console.log('Upload results:', results);
})();
```

## 🎯 Use Cases

### Frontend Deployment

```bash
npm run build
oss-uploader upload ./dist -t static/my-app/
```

### CI/CD Integration

```yaml
# GitHub Actions - Using environment variables (recommended)
- name: Upload to OSS
  env:
    OSS_REGION: ${{ secrets.OSS_REGION }}
    OSS_ACCESS_KEY_ID: ${{ secrets.OSS_ACCESS_KEY_ID }}
    OSS_ACCESS_KEY_SECRET: ${{ secrets.OSS_ACCESS_KEY_SECRET }}
    OSS_BUCKET: ${{ secrets.OSS_BUCKET }}
  run: |
    npm install -g @atomfe/oss-uploader
    oss-uploader upload ./dist -t static/

# Alternative: Using config file
- name: Upload to OSS
  run: |
    npm install -g @atomfe/oss-uploader
    echo '{"region":"${{ secrets.OSS_REGION }}","accessKeyId":"${{ secrets.OSS_ACCESS_KEY_ID }}","accessKeySecret":"${{ secrets.OSS_ACCESS_KEY_SECRET }}","bucket":"${{ secrets.OSS_BUCKET }}"}' > .ossrc.json
    oss-uploader upload ./dist -t static/
```

### Package.json Scripts

```json
{
  "scripts": {
    "deploy": "npm run build && oss-uploader upload ./dist -t static/"
  }
}
```

### Using Mapping File

```javascript
// Read mapping file
import mapping from './.oss-uploader-mapping.json' assert { type: 'json' };

// Get all uploaded URLs
const urls = mapping.files.map(f => f.url);

// Update resource references in HTML
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

## 🔐 Security

- ✅ Add `.ossrc.json` to `.gitignore`
- ✅ Use RAM sub-account instead of root account
- ✅ Use environment variables in CI/CD
- ✅ Rotate AccessKey regularly
- ❌ Never hardcode credentials in code

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

For bug reports or feature requests, please create an issue.

## 📝 Development

```bash
# Install dependencies
pnpm install

# Development mode
pnpm run dev

# Build
pnpm run build

# Test
pnpm run test
pnpm run test:coverage

# Lint & Format
pnpm run lint
pnpm run format
```

## 🆕 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.

## 📄 License

[MIT](./LICENSE) © 2025

## 🌟 Core Features

### Modern Technology Stack

- ✅ **Dual Module Format** - Support both ESM and CommonJS
- ✅ **TypeScript 5.7** - Full type safety
- ✅ **tsup Build** - Ultra-fast builds with esbuild
- ✅ **Vitest Testing** - Modern test framework
- ✅ **npm Provenance** - Supply chain security

### Developer Experience

- 🔥 **Fast Build** - Lightning-fast 0.05s builds
- 🎨 **Code Quality** - ESLint + Prettier
- 📊 **Test Coverage** - Unit tests + coverage reports
- 🔄 **Auto Release** - Automated version management with Changesets
- 📚 **Complete Docs** - Bilingual documentation (EN/CN)

## 💡 Tips & Tricks

### 1. Using Environment Variables

```bash
export OSS_ACCESS_KEY_ID="your-key"
export OSS_ACCESS_KEY_SECRET="your-secret"
export OSS_BUCKET="your-bucket"
export OSS_REGION="YOUR_REGION"
```

### 2. Batch Process Mapping Files

```bash
# Merge multiple mapping files
cat .oss-uploader-mapping-*.json | jq -s 'map(.files) | add' > all-uploads.json
```

### 3. Automated Deployment Script

```bash
#!/bin/bash
# deploy.sh

# Build project
npm run build

# Upload to OSS
oss-uploader upload ./dist -t "static/v$(date +%Y%m%d)/" -v

# Read mapping file and send notification
node -e "
const mapping = require('./.oss-uploader-mapping.json');
console.log(\`✅ Upload complete! Total \${mapping.totalFiles} files\`);
console.log(\`📦 Total size: \${(mapping.totalSize / 1024 / 1024).toFixed(2)} MB\`);
"
```

## 🔗 Related Links

- [Aliyun OSS Documentation](https://www.alibabacloud.com/help/en/oss/)
- [GitHub Repository](https://github.com/lorainwings/aliyun-oss-uploader)
- [npm Package](https://www.npmjs.com/package/@atomfe/oss-uploader)
- [Issue Tracker](https://github.com/lorainwings/aliyun-oss-uploader/issues)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/lorainwings">lorainwings</a>
</p>
