import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OSSUploader } from '../src/uploader';
import type { OSSConfig } from '../src/types';

// Mock ali-oss
vi.mock('ali-oss', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      put: vi.fn().mockResolvedValue({ name: 'test.txt', url: 'http://example.com/test.txt' }),
      head: vi.fn().mockRejectedValue({ code: 'NoSuchKey' }),
      list: vi.fn().mockResolvedValue({ objects: [] }),
      delete: vi.fn().mockResolvedValue({}),
      getBucketInfo: vi.fn().mockResolvedValue({ bucket: { name: 'test-bucket' } }),
    })),
  };
});

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    red: (str: string) => str,
    green: (str: string) => str,
    blue: (str: string) => str,
    cyan: (str: string) => str,
  },
}));

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  })),
}));

// Mock cli-progress
vi.mock('cli-progress', () => ({
  default: {
    SingleBar: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      update: vi.fn(),
      stop: vi.fn(),
    })),
    Presets: {
      shades_classic: {},
    },
  },
}));

describe('OSSUploader', () => {
  let uploader: OSSUploader;
  let mockConfig: OSSConfig;

  beforeEach(() => {
    mockConfig = {
      region: 'oss-cn-hangzhou',
      accessKeyId: 'test-key-id',
      accessKeySecret: 'test-key-secret',
      bucket: 'test-bucket',
    };

    uploader = new OSSUploader(mockConfig);
  });

  describe('constructor', () => {
    it('should create an instance with config', () => {
      expect(uploader).toBeInstanceOf(OSSUploader);
    });

    it('should apply default secure and timeout values', () => {
      const uploaderInstance = new OSSUploader(mockConfig);
      expect(uploaderInstance).toBeDefined();
    });

    it('should handle custom endpoint', () => {
      const customConfig = { ...mockConfig, endpoint: 'custom.oss.com' };
      const uploaderInstance = new OSSUploader(customConfig);
      expect(uploaderInstance).toBeDefined();
    });

    it('should handle secure false option', () => {
      const customConfig = { ...mockConfig, secure: false };
      const uploaderInstance = new OSSUploader(customConfig);
      expect(uploaderInstance).toBeDefined();
    });

    it('should handle internal option', () => {
      const customConfig = { ...mockConfig, internal: true };
      const uploaderInstance = new OSSUploader(customConfig);
      expect(uploaderInstance).toBeDefined();
    });

    it('should handle custom timeout', () => {
      const customConfig = { ...mockConfig, timeout: 120000 };
      const uploaderInstance = new OSSUploader(customConfig);
      expect(uploaderInstance).toBeDefined();
    });
  });

  describe('listFiles', () => {
    it('should list files from OSS bucket', async () => {
      const files = await uploader.listFiles();
      expect(Array.isArray(files)).toBe(true);
    });

    it('should list files with prefix', async () => {
      const files = await uploader.listFiles('static/');
      expect(Array.isArray(files)).toBe(true);
    });

    it('should list files with custom maxKeys', async () => {
      const files = await uploader.listFiles('', 500);
      expect(Array.isArray(files)).toBe(true);
    });

    it('should list files with prefix and maxKeys', async () => {
      const files = await uploader.listFiles('images/', 100);
      expect(Array.isArray(files)).toBe(true);
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      // Mock console.log to suppress output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await uploader.deleteFile('test.txt');

      consoleSpy.mockRestore();
    });
  });

  describe('getBucketInfo', () => {
    it('should get bucket information', async () => {
      const info = await uploader.getBucketInfo();
      expect(info).toBeDefined();
    });

    it('should return bucket with name', async () => {
      const info = await uploader.getBucketInfo();
      expect(info.bucket).toBeDefined();
      expect(info.bucket.name).toBe('test-bucket');
    });
  });

  describe('private helper methods', () => {
    let uploaderAny: any;

    beforeEach(() => {
      uploaderAny = uploader;
    });

    describe('formatBytes', () => {
      it('should format 0 bytes', () => {
        expect(uploaderAny.formatBytes(0)).toBe('0 Bytes');
      });

      it('should format KB', () => {
        expect(uploaderAny.formatBytes(1024)).toBe('1 KB');
      });

      it('should format MB', () => {
        expect(uploaderAny.formatBytes(1024 * 1024)).toBe('1 MB');
      });

      it('should format GB', () => {
        expect(uploaderAny.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      });

      it('should format TB', () => {
        expect(uploaderAny.formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
      });

      it('should round decimal values', () => {
        expect(uploaderAny.formatBytes(1536)).toBe('1.5 KB');
        expect(uploaderAny.formatBytes(1024 * 1024 * 1.5)).toBe('1.5 MB');
      });
    });

    describe('formatLocalTime', () => {
      it('should format date to local time string', () => {
        const date = new Date('2025-10-19T06:08:44.181Z');
        const formatted = uploaderAny.formatLocalTime(date);
        expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      });

      it('should pad single digit values', () => {
        const date = new Date(2025, 0, 5, 8, 3, 7); // Jan 5, 2025 08:03:07
        const formatted = uploaderAny.formatLocalTime(date);
        expect(formatted).toBe('2025-01-05 08:03:07');
      });

      it('should format current date correctly', () => {
        const now = new Date();
        const formatted = uploaderAny.formatLocalTime(now);
        expect(formatted).toContain(now.getFullYear().toString());
        expect(formatted).toContain('-');
        expect(formatted).toContain(':');
      });
    });

    describe('normalizePath', () => {
      it('should convert backslashes to forward slashes', () => {
        expect(uploaderAny.normalizePath('path\\to\\file.txt')).toBe('path/to/file.txt');
      });

      it('should keep forward slashes unchanged', () => {
        expect(uploaderAny.normalizePath('path/to/file.txt')).toBe('path/to/file.txt');
      });

      it('should handle mixed slashes', () => {
        expect(uploaderAny.normalizePath('path\\to/file\\test.txt')).toBe('path/to/file/test.txt');
      });

      it('should handle empty string', () => {
        expect(uploaderAny.normalizePath('')).toBe('');
      });
    });

    describe('truncateFilename', () => {
      it('should not truncate short filenames', () => {
        const shortName = 'file.txt';
        expect(uploaderAny.truncateFilename(shortName)).toBe(shortName);
      });

      it('should truncate long filenames', () => {
        const longName = 'a'.repeat(50) + '.txt';
        const truncated = uploaderAny.truncateFilename(longName);
        expect(truncated.length).toBe(40);
        expect(truncated).toMatch(/^\.\.\./);
      });

      it('should keep exactly 40 character filename', () => {
        const exactName = 'a'.repeat(40);
        expect(uploaderAny.truncateFilename(exactName)).toBe(exactName);
      });
    });

    describe('generateContentHash', () => {
      it('should generate 8-character hash from file content', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
        const testFile = path.join(tmpDir, 'test.txt');
        fs.writeFileSync(testFile, 'test content');

        try {
          const hash = uploaderAny.generateContentHash(testFile);
          expect(hash).toHaveLength(8);
          expect(hash).toMatch(/^[a-f0-9]{8}$/);
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      });

      it('should generate consistent hash for same content', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
        const testFile = path.join(tmpDir, 'test.txt');
        fs.writeFileSync(testFile, 'same content');

        try {
          const hash1 = uploaderAny.generateContentHash(testFile);
          const hash2 = uploaderAny.generateContentHash(testFile);
          expect(hash1).toBe(hash2);
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      });

      it('should generate different hash for different content', async () => {
        const fs = await import('fs');
        const path = await import('path');
        const os = await import('os');

        const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
        const testFile1 = path.join(tmpDir, 'test1.txt');
        const testFile2 = path.join(tmpDir, 'test2.txt');
        fs.writeFileSync(testFile1, 'content 1');
        fs.writeFileSync(testFile2, 'content 2');

        try {
          const hash1 = uploaderAny.generateContentHash(testFile1);
          const hash2 = uploaderAny.generateContentHash(testFile2);
          expect(hash1).not.toBe(hash2);
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true });
        }
      });
    });

    describe('addHashToFilename', () => {
      it('should add hash before file extension', () => {
        const result = uploaderAny.addHashToFilename('file.js', 'a1b2c3d4');
        expect(result).toBe('file.a1b2c3d4.js');
      });

      it('should handle files without extension', () => {
        const result = uploaderAny.addHashToFilename('README', 'a1b2c3d4');
        expect(result).toBe('README.a1b2c3d4');
      });

      it('should handle files with multiple dots', () => {
        const result = uploaderAny.addHashToFilename('file.min.js', 'a1b2c3d4');
        expect(result).toBe('file.min.a1b2c3d4.js');
      });

      it('should handle dotfiles', () => {
        const result = uploaderAny.addHashToFilename('.gitignore', 'a1b2c3d4');
        expect(result).toBe('.gitignore.a1b2c3d4');
      });
    });

    describe('generateUrl', () => {
      it('should generate HTTPS URL by default', () => {
        const url = uploaderAny.generateUrl('test/file.txt');
        expect(url).toContain('https://');
        expect(url).toContain('test-bucket');
        expect(url).toContain('test/file.txt');
      });

      it('should generate HTTP URL when secure is false', () => {
        const insecureConfig = { ...mockConfig, secure: false };
        const insecureUploader: any = new OSSUploader(insecureConfig);
        const url = insecureUploader.generateUrl('test/file.txt');
        expect(url).toContain('http://');
      });

      it('should use custom endpoint', () => {
        const customConfig = { ...mockConfig, endpoint: 'custom.endpoint.com' };
        const customUploader: any = new OSSUploader(customConfig);
        const url = customUploader.generateUrl('test/file.txt');
        expect(url).toContain('custom.endpoint.com');
      });

      it('should use region endpoint by default', () => {
        const url = uploaderAny.generateUrl('test/file.txt');
        expect(url).toContain('oss-cn-hangzhou.aliyuncs.com');
      });

      it('should properly encode Chinese characters in path', () => {
        const url = uploaderAny.generateUrl('测试/文件.txt');
        expect(url).toContain('%E6%B5%8B%E8%AF%95'); // Encoded "测试"
        expect(url).toContain('%E6%96%87%E4%BB%B6.txt'); // Encoded "文件.txt"
        expect(url).toContain('/'); // Should preserve path separators
      });

      it('should properly encode special characters', () => {
        const url = uploaderAny.generateUrl('path/file name with spaces.txt');
        expect(url).toContain('file%20name%20with%20spaces.txt');
        expect(url).not.toContain(' '); // No unencoded spaces
      });

      it('should handle mixed Chinese and English paths', () => {
        const url = uploaderAny.generateUrl('static/图片/logo.png');
        expect(url).toContain('static/'); // English part preserved
        expect(url).toContain('%E5%9B%BE%E7%89%87'); // Encoded "图片"
        expect(url).toContain('logo.png'); // English filename preserved
      });

      it('should encode special characters like #, ?, &', () => {
        const url = uploaderAny.generateUrl('path/file#1.txt');
        expect(url).toContain('file%231.txt'); // # should be encoded
        expect(url).not.toContain('#');
      });
    });

    describe('createProgressBar', () => {
      it('should create a progress bar instance', () => {
        const progressBar = uploaderAny.createProgressBar();
        expect(progressBar).toBeDefined();
        expect(progressBar.start).toBeDefined();
        expect(progressBar.update).toBeDefined();
        expect(progressBar.stop).toBeDefined();
      });
    });

    describe('fileExistsInOSS', () => {
      it('should return true when file exists', async () => {
        // The mock will resolve for this test
        vi.mocked(uploaderAny.client.head).mockResolvedValueOnce({ name: 'test.txt' });
        const exists = await uploaderAny.fileExistsInOSS('test.txt');
        expect(exists).toBe(true);
      });

      it('should return false when file does not exist (NoSuchKey)', async () => {
        // The default mock rejects with NoSuchKey
        const exists = await uploaderAny.fileExistsInOSS('nonexistent.txt');
        expect(exists).toBe(false);
      });
    });
  });

  describe('uploadMultiple', () => {
    let consoleSpy: any;

    beforeEach(() => {
      // Mock console.log to suppress output
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should upload multiple files successfully', async () => {
      // Create temporary test files
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const file1 = path.join(tmpDir, 'test1.txt');
      const file2 = path.join(tmpDir, 'test2.txt');

      fs.writeFileSync(file1, 'test content 1');
      fs.writeFileSync(file2, 'test content 2');

      try {
        const results = await uploader.uploadMultiple([file1, file2], 'uploads', true, false);

        expect(results).toHaveLength(2);
        expect(results.every(r => r.success)).toBe(true);
      } finally {
        // Cleanup
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should handle non-existent files gracefully', async () => {
      const results = await uploader.uploadMultiple(
        ['/non/existent/file1.txt', '/non/existent/file2.txt'],
        '',
        true,
        false
      );

      expect(results).toHaveLength(2);
      expect(results.every(r => !r.success)).toBe(true);
      expect(results.every(r => r.error === 'Source path does not exist')).toBe(true);
    });

    it('should handle mixed valid and invalid sources', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const validFile = path.join(tmpDir, 'valid.txt');
      fs.writeFileSync(validFile, 'valid content');

      try {
        const results = await uploader.uploadMultiple(
          [validFile, '/non/existent/file.txt'],
          '',
          true,
          false
        );

        expect(results).toHaveLength(2);
        expect(results[0]?.success).toBe(true);
        expect(results[1]?.success).toBe(false);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('generateMappingFile', () => {
    it('should be callable as public method', async () => {
      const results = [
        {
          success: true,
          localPath: '/test/file.txt',
          remotePath: 'uploads/file.txt',
          url: 'https://example.com/uploads/file.txt',
          size: 1024,
        },
      ];

      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const mappingFile = path.join(tmpDir, 'mapping.json');

      try {
        await uploader.generateMappingFile(results, mappingFile);

        expect(fs.existsSync(mappingFile)).toBe(true);
        const content = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
        expect(content.files).toHaveLength(1);
        expect(content.totalFiles).toBe(1);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('Content Hash Integration', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should add content hash to filename when contentHash is true', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const testFile = path.join(tmpDir, 'test.js');
      fs.writeFileSync(testFile, 'console.log("test");');

      try {
        const result = await uploader.upload({
          source: testFile,
          target: '',
          contentHash: true,
          verbose: false,
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.success).toBe(true);
        expect(result[0]?.remotePath).toMatch(/^test\.[a-f0-9]{8}\.js$/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should not add content hash to filename when contentHash is false', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const testFile = path.join(tmpDir, 'test.js');
      fs.writeFileSync(testFile, 'console.log("test");');

      try {
        const result = await uploader.upload({
          source: testFile,
          target: '',
          contentHash: false,
          verbose: false,
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.success).toBe(true);
        expect(result[0]?.remotePath).toBe('test.js');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should add content hash by default when contentHash option is not specified', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const testFile = path.join(tmpDir, 'app.css');
      fs.writeFileSync(testFile, 'body { margin: 0; }');

      try {
        const result = await uploader.upload({
          source: testFile,
          target: 'styles',
          verbose: false,
        });

        expect(result).toHaveLength(1);
        expect(result[0]?.success).toBe(true);
        expect(result[0]?.remotePath).toMatch(/^styles\/app\.[a-f0-9]{8}\.css$/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should add content hash to all files in directory upload', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const file1 = path.join(tmpDir, 'file1.js');
      const file2 = path.join(tmpDir, 'file2.css');
      fs.writeFileSync(file1, 'console.log("file1");');
      fs.writeFileSync(file2, 'body { color: red; }');

      try {
        const results = await uploader.upload({
          source: tmpDir,
          target: 'dist',
          recursive: true,
          contentHash: true,
          verbose: false,
        });

        expect(results).toHaveLength(2);
        expect(results.every(r => r.success)).toBe(true);

        // Find results by local path (order may vary)
        const jsResult = results.find(r => r.localPath === file1);
        const cssResult = results.find(r => r.localPath === file2);

        expect(jsResult?.remotePath).toMatch(/^dist\/file1\.[a-f0-9]{8}\.js$/);
        expect(cssResult?.remotePath).toMatch(/^dist\/file2\.[a-f0-9]{8}\.css$/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should preserve directory structure with content hash', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const subDir = path.join(tmpDir, 'assets');
      fs.mkdirSync(subDir);
      const file1 = path.join(tmpDir, 'index.html');
      const file2 = path.join(subDir, 'style.css');
      fs.writeFileSync(file1, '<html></html>');
      fs.writeFileSync(file2, 'body {}');

      try {
        const results = await uploader.upload({
          source: tmpDir,
          target: '',
          recursive: true,
          contentHash: true,
          verbose: false,
        });

        expect(results).toHaveLength(2);
        expect(results.every(r => r.success)).toBe(true);

        const indexResult = results.find(r => r.localPath === file1);
        const styleResult = results.find(r => r.localPath === file2);

        expect(indexResult?.remotePath).toMatch(/^index\.[a-f0-9]{8}\.html$/);
        expect(styleResult?.remotePath).toMatch(/^assets\/style\.[a-f0-9]{8}\.css$/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should work with uploadMultiple and contentHash enabled', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const file1 = path.join(tmpDir, 'main.js');
      const file2 = path.join(tmpDir, 'vendor.js');
      fs.writeFileSync(file1, 'function main() {}');
      fs.writeFileSync(file2, 'function vendor() {}');

      try {
        const results = await uploader.uploadMultiple([file1, file2], 'js', true, false, true);

        expect(results).toHaveLength(2);
        expect(results.every(r => r.success)).toBe(true);
        expect(results[0]?.remotePath).toMatch(/^js\/main\.[a-f0-9]{8}\.js$/);
        expect(results[1]?.remotePath).toMatch(/^js\/vendor\.[a-f0-9]{8}\.js$/);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should work with uploadMultiple and contentHash disabled', async () => {
      const fs = await import('fs');
      const path = await import('path');
      const os = await import('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oss-test-'));
      const file1 = path.join(tmpDir, 'data.json');
      const file2 = path.join(tmpDir, 'config.xml');
      fs.writeFileSync(file1, '{"key": "value"}');
      fs.writeFileSync(file2, '<config></config>');

      try {
        const results = await uploader.uploadMultiple([file1, file2], '', true, false, false);

        expect(results).toHaveLength(2);
        expect(results.every(r => r.success)).toBe(true);
        expect(results[0]?.remotePath).toBe('data.json');
        expect(results[1]?.remotePath).toBe('config.xml');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
