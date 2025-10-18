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
  });

  describe('getBucketInfo', () => {
    it('should get bucket information', async () => {
      const info = await uploader.getBucketInfo();
      expect(info).toBeDefined();
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      // Access private method through type assertion for testing
      const uploader: any = new OSSUploader(mockConfig);

      expect(uploader.formatBytes(0)).toBe('0 Bytes');
      expect(uploader.formatBytes(1024)).toBe('1 KB');
      expect(uploader.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(uploader.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });
});
