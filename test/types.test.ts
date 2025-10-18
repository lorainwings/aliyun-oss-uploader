import { describe, it, expect } from 'vitest';
import type { OSSConfig, UploadOptions, UploadResult } from '../src/types';

describe('types', () => {
  describe('OSSConfig', () => {
    it('should accept valid config', () => {
      const config: OSSConfig = {
        region: 'oss-cn-hangzhou',
        accessKeyId: 'test-key',
        accessKeySecret: 'test-secret',
        bucket: 'test-bucket',
      };

      expect(config.region).toBe('oss-cn-hangzhou');
      expect(config.accessKeyId).toBe('test-key');
      expect(config.accessKeySecret).toBe('test-secret');
      expect(config.bucket).toBe('test-bucket');
    });

    it('should accept optional fields', () => {
      const config: OSSConfig = {
        region: 'oss-cn-hangzhou',
        accessKeyId: 'test-key',
        accessKeySecret: 'test-secret',
        bucket: 'test-bucket',
        endpoint: 'custom.endpoint.com',
        internal: true,
        secure: true,
        timeout: 30000,
      };

      expect(config.endpoint).toBe('custom.endpoint.com');
      expect(config.internal).toBe(true);
      expect(config.secure).toBe(true);
      expect(config.timeout).toBe(30000);
    });
  });

  describe('UploadOptions', () => {
    it('should accept required fields', () => {
      const options: UploadOptions = {
        source: './dist',
      };

      expect(options.source).toBe('./dist');
    });

    it('should accept all optional fields', () => {
      const options: UploadOptions = {
        source: './dist',
        target: 'static/',
        recursive: true,
        overwrite: false,
        include: ['**/*.js'],
        exclude: ['**/*.map'],
        verbose: true,
      };

      expect(options.target).toBe('static/');
      expect(options.recursive).toBe(true);
      expect(options.overwrite).toBe(false);
      expect(options.include).toEqual(['**/*.js']);
      expect(options.exclude).toEqual(['**/*.map']);
      expect(options.verbose).toBe(true);
    });
  });

  describe('UploadResult', () => {
    it('should represent successful upload', () => {
      const result: UploadResult = {
        success: true,
        localPath: './dist/index.js',
        remotePath: 'static/index.js',
        size: 1024,
      };

      expect(result.success).toBe(true);
      expect(result.localPath).toBe('./dist/index.js');
      expect(result.remotePath).toBe('static/index.js');
      expect(result.size).toBe(1024);
      expect(result.error).toBeUndefined();
    });

    it('should represent failed upload', () => {
      const result: UploadResult = {
        success: false,
        localPath: './dist/index.js',
        remotePath: 'static/index.js',
        error: 'Network error',
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.size).toBeUndefined();
    });
  });
});
