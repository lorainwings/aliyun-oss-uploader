import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfig, createSampleConfig } from '../src/config';
import * as fs from 'fs';
import * as path from 'path';

// Mock modules
vi.mock('chalk', () => ({
  default: {
    red: (str: string) => str,
    green: (str: string) => str,
    yellow: (str: string) => str,
    cyan: (str: string) => str,
  },
}));

describe('config', () => {
  describe('loadConfig', () => {
    const testConfigDir = path.join(process.cwd(), 'test-configs');

    beforeEach(() => {
      // Create test directory
      if (!fs.existsSync(testConfigDir)) {
        fs.mkdirSync(testConfigDir, { recursive: true });
      }
    });

    afterEach(() => {
      // Cleanup test files
      if (fs.existsSync(testConfigDir)) {
        const files = fs.readdirSync(testConfigDir);
        files.forEach(file => {
          fs.unlinkSync(path.join(testConfigDir, file));
        });
        fs.rmdirSync(testConfigDir);
      }
    });

    it('should load config from JSON file', async () => {
      const configPath = path.join(testConfigDir, '.ossrc.json');
      const mockConfig = {
        region: 'oss-cn-hangzhou',
        accessKeyId: 'test-key-id',
        accessKeySecret: 'test-key-secret',
        bucket: 'test-bucket',
      };

      fs.writeFileSync(configPath, JSON.stringify(mockConfig));

      const config = await loadConfig(configPath);

      expect(config).toEqual(mockConfig);
    });

    it('should throw error when config file does not exist', async () => {
      const nonExistentPath = path.join(testConfigDir, 'nonexistent.json');

      await expect(loadConfig(nonExistentPath)).rejects.toThrow('Config file not found');
    });

    it('should throw error when required fields are missing', async () => {
      const configPath = path.join(testConfigDir, 'invalid.json');
      const invalidConfig = {
        region: 'oss-cn-hangzhou',
        // Missing required fields
      };

      fs.writeFileSync(configPath, JSON.stringify(invalidConfig));

      await expect(loadConfig(configPath)).rejects.toThrow('Missing required configuration fields');
    });

    it('should throw error when no config found automatically', async () => {
      // Save current directory and change to testConfigDir to ensure no config files exist
      const originalCwd = process.cwd();
      process.chdir(testConfigDir);

      try {
        await expect(loadConfig()).rejects.toThrow('No configuration found');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should load config from environment variables', async () => {
      // Save current directory and change to testConfigDir to avoid picking up existing config files
      const originalCwd = process.cwd();
      process.chdir(testConfigDir);

      // Set environment variables
      process.env.OSS_REGION = 'oss-cn-beijing';
      process.env.OSS_ACCESS_KEY_ID = 'env-key-id';
      process.env.OSS_ACCESS_KEY_SECRET = 'env-key-secret';
      process.env.OSS_BUCKET = 'env-bucket';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        const config = await loadConfig();

        expect(config).toMatchObject({
          region: 'oss-cn-beijing',
          accessKeyId: 'env-key-id',
          accessKeySecret: 'env-key-secret',
          bucket: 'env-bucket',
        });

        expect(consoleLogSpy).toHaveBeenCalledWith(
          expect.stringContaining('Using configuration from environment variables')
        );
      } finally {
        // Cleanup
        delete process.env.OSS_REGION;
        delete process.env.OSS_ACCESS_KEY_ID;
        delete process.env.OSS_ACCESS_KEY_SECRET;
        delete process.env.OSS_BUCKET;
        consoleLogSpy.mockRestore();
        process.chdir(originalCwd);
      }
    });

    it('should load optional config from environment variables', async () => {
      // Save current directory and change to testConfigDir to avoid picking up existing config files
      const originalCwd = process.cwd();
      process.chdir(testConfigDir);

      // Set all environment variables including optional ones
      process.env.OSS_REGION = 'oss-cn-beijing';
      process.env.OSS_ACCESS_KEY_ID = 'env-key-id';
      process.env.OSS_ACCESS_KEY_SECRET = 'env-key-secret';
      process.env.OSS_BUCKET = 'env-bucket';
      process.env.OSS_ENDPOINT = 'custom-endpoint.com';
      process.env.OSS_INTERNAL = 'true';
      process.env.OSS_SECURE = 'false';
      process.env.OSS_TIMEOUT = '30000';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      try {
        const config = await loadConfig();

        expect(config).toMatchObject({
          region: 'oss-cn-beijing',
          accessKeyId: 'env-key-id',
          accessKeySecret: 'env-key-secret',
          bucket: 'env-bucket',
          endpoint: 'custom-endpoint.com',
          internal: true,
          secure: false,
          timeout: 30000,
        });
      } finally {
        // Cleanup
        delete process.env.OSS_REGION;
        delete process.env.OSS_ACCESS_KEY_ID;
        delete process.env.OSS_ACCESS_KEY_SECRET;
        delete process.env.OSS_BUCKET;
        delete process.env.OSS_ENDPOINT;
        delete process.env.OSS_INTERNAL;
        delete process.env.OSS_SECURE;
        delete process.env.OSS_TIMEOUT;
        consoleLogSpy.mockRestore();
        process.chdir(originalCwd);
      }
    });

    it('should use config file when both file and environment variables exist', async () => {
      const configPath = path.join(testConfigDir, '.ossrc.json');
      const fileConfig = {
        region: 'oss-cn-hangzhou',
        accessKeyId: 'file-key-id',
        accessKeySecret: 'file-key-secret',
        bucket: 'file-bucket',
      };

      fs.writeFileSync(configPath, JSON.stringify(fileConfig));

      // Set env vars (should be ignored when config file exists)
      process.env.OSS_REGION = 'oss-cn-beijing';
      process.env.OSS_BUCKET = 'env-bucket';
      process.env.OSS_ACCESS_KEY_ID = 'env-key-id';
      process.env.OSS_ACCESS_KEY_SECRET = 'env-key-secret';

      try {
        const config = await loadConfig(configPath);

        // Config file should be used, not environment variables
        expect(config.region).toBe('oss-cn-hangzhou');
        expect(config.bucket).toBe('file-bucket');
        expect(config.accessKeyId).toBe('file-key-id');
        expect(config.accessKeySecret).toBe('file-key-secret');
      } finally {
        // Cleanup
        delete process.env.OSS_REGION;
        delete process.env.OSS_BUCKET;
        delete process.env.OSS_ACCESS_KEY_ID;
        delete process.env.OSS_ACCESS_KEY_SECRET;
      }
    });

    it('should throw error when environment variables are incomplete', async () => {
      // Save current directory and change to testConfigDir to avoid picking up existing config files
      const originalCwd = process.cwd();
      process.chdir(testConfigDir);

      // Set only partial env vars (missing required fields)
      process.env.OSS_REGION = 'oss-cn-beijing';
      process.env.OSS_BUCKET = 'env-bucket';
      // Missing: OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET

      try {
        await expect(loadConfig()).rejects.toThrow('Missing required configuration fields');
      } finally {
        // Cleanup
        delete process.env.OSS_REGION;
        delete process.env.OSS_BUCKET;
        process.chdir(originalCwd);
      }
    });

    it('should warn for non-standard region format', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const configPath = path.join(testConfigDir, '.ossrc.json');
      const mockConfig = {
        region: 'cn-hangzhou', // Non-standard format
        accessKeyId: 'test-key-id',
        accessKeySecret: 'test-key-secret',
        bucket: 'test-bucket',
      };

      fs.writeFileSync(configPath, JSON.stringify(mockConfig));

      await loadConfig(configPath);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("doesn't follow the standard format")
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('createSampleConfig', () => {
    const testConfigPath = path.join(process.cwd(), '.ossrc-test.json');

    afterEach(() => {
      // Cleanup test file
      if (fs.existsSync(testConfigPath)) {
        fs.unlinkSync(testConfigPath);
      }
    });

    it('should create sample config file', () => {
      createSampleConfig(testConfigPath);

      expect(fs.existsSync(testConfigPath)).toBe(true);

      const content = fs.readFileSync(testConfigPath, 'utf-8');
      const config = JSON.parse(content);

      expect(config).toHaveProperty('region');
      expect(config).toHaveProperty('accessKeyId');
      expect(config).toHaveProperty('accessKeySecret');
      expect(config).toHaveProperty('bucket');
      expect(config.region).toBe('oss-cn-hangzhou');
    });

    it('should throw error when config file already exists', () => {
      // Create a dummy file
      fs.writeFileSync(testConfigPath, '{}');

      expect(() => createSampleConfig(testConfigPath)).toThrow('Config file already exists');
    });
  });
});
