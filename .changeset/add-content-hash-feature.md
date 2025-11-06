---
'@atomfe/oss-uploader': minor
---

feat: add content hash feature for automatic cache busting

This adds an 8-character MD5 hash to uploaded filenames (similar to webpack's chunkhash):

- File `app.js` becomes `app.a1b2c3d4.js`
- Enabled by default, can be disabled with `contentHash: false` option
- CLI flag: `--no-content-hash` to disable the feature
- Perfect for CDN cache management and browser cache invalidation
- Maintains directory structure and supports all upload modes (single file, directory, multiple files)
