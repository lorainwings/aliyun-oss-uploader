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
      await expect(loadConfig()).rejects.toThrow('No configuration found');
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
