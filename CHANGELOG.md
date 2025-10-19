# Changelog

## 1.1.0

### Minor Changes

- ### Added
  - 📊 Add real-time progress display with CLI progress bar
    - Beautiful progress bar in default mode showing percentage, file count, and current file
    - Enhanced verbose mode with detailed upload information using ora spinners
    - Progress tracking for batch uploads
  - ⚙️ Enhanced configuration initialization
    - Add init command type parameter support
    - Improved config file generation with better type handling
    - Better default configuration templates

  ### Changed
  - 🔧 Optimized uploader code structure
    - Extracted helper methods for better code organization
    - Reduced code complexity and improved maintainability
    - Better error handling and file path normalization

  ### Testing
  - ✅ Significantly increased test coverage (from 6 to 33 tests for uploader)
    - Added comprehensive tests for all public and private methods
    - Mock strategy improvements for better test isolation
    - 100% test passing rate with coverage thresholds met

## 1.0.0

### Added

- 🚀 Initial release
- 📤 Upload files and directories to Aliyun OSS
- 📂 Multiple configuration file formats support
- 📋 List files in OSS bucket
- 🗑️ Delete files from OSS bucket
- ℹ️ View bucket information
- ⚙️ Initialize configuration with sample template
- 🎯 Glob patterns for file filtering
- 📊 Verbose mode with progress indicators
- 💪 Full TypeScript support
- 🛠️ ESLint 9 + TypeScript-ESLint v8
- 🤖 GitHub Actions CI/CD with changesets
