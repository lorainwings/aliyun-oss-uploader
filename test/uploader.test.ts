import { describe, it, expect, vi, beforeEach } from 'vitest';
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
});
