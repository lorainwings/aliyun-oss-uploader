import { cosmiconfigSync } from 'cosmiconfig';
import { type OSSConfig } from './types';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

const CONFIG_MODULE_NAME = 'oss';

/**
 * Load OSS configuration from environment variables
 */
function loadConfigFromEnv(): Partial<OSSConfig> | null {
  const {
    OSS_REGION,
    OSS_ACCESS_KEY_ID,
    OSS_ACCESS_KEY_SECRET,
    OSS_BUCKET,
    OSS_ENDPOINT,
    OSS_INTERNAL,
    OSS_SECURE,
    OSS_TIMEOUT,
  } = process.env;

  // Check if at least one env var is set
  if (!OSS_REGION && !OSS_ACCESS_KEY_ID && !OSS_ACCESS_KEY_SECRET && !OSS_BUCKET) {
    return null;
  }

  const config: Partial<OSSConfig> = {};

  if (OSS_REGION) config.region = OSS_REGION;
  if (OSS_ACCESS_KEY_ID) config.accessKeyId = OSS_ACCESS_KEY_ID;
  if (OSS_ACCESS_KEY_SECRET) config.accessKeySecret = OSS_ACCESS_KEY_SECRET;
  if (OSS_BUCKET) config.bucket = OSS_BUCKET;
  if (OSS_ENDPOINT) config.endpoint = OSS_ENDPOINT;
  if (OSS_INTERNAL !== undefined) config.internal = OSS_INTERNAL === 'true';
  if (OSS_SECURE !== undefined) config.secure = OSS_SECURE === 'true';
  if (OSS_TIMEOUT) config.timeout = parseInt(OSS_TIMEOUT, 10);

  return config;
}

/**
 * Load OSS configuration from various sources
 * Priority: Config file first, fallback to Environment variables
 * Supports: .ossrc, .ossrc.json, .ossrc.yaml, .ossrc.yml, oss.config.js, package.json
 */
export async function loadConfig(configPath?: string): Promise<OSSConfig> {
  let config: Partial<OSSConfig> | null = null;

  // If config path is explicitly provided
  if (configPath) {
    if (!fs.existsSync(configPath)) {
      throw new Error(chalk.red(`Config file not found: ${configPath}`));
    }

    const absolutePath = path.resolve(configPath);
    const ext = path.extname(absolutePath);

    try {
      if (ext === '.js') {
        // Use dynamic import for .js files in ESM
        const fileUrl = pathToFileURL(absolutePath).href;
        const module = await import(fileUrl);
        config = module.default || module;
      } else if (ext === '.json' || ext === '') {
        const content = fs.readFileSync(absolutePath, 'utf-8');
        config = JSON.parse(content);
      } else {
        throw new Error(`Unsupported config file format: ${ext}`);
      }
    } catch (error: any) {
      throw new Error(chalk.red(`Failed to load config from ${configPath}: ${error.message}`));
    }
  } else {
    // Search for config file automatically
    const explorer = cosmiconfigSync(CONFIG_MODULE_NAME, {
      searchPlaces: [
        '.ossrc',
        '.ossrc.json',
        '.ossrc.yaml',
        '.ossrc.yml',
        'oss.config.js',
        'oss.config.json',
        'package.json',
      ],
    });

    const result = explorer.search();

    if (result && result.config) {
      config = result.config;
    }
  }

  // If no config file found, try loading from environment variables
  if (!config) {
    const envConfig = loadConfigFromEnv();
    if (envConfig) {
      config = envConfig;
      console.log(chalk.cyan('ℹ Using configuration from environment variables'));
    }
  }

  if (!config) {
    throw new Error(
      chalk.red(
        'No configuration found. Please create a .ossrc.json, specify config path, or set environment variables (OSS_REGION, OSS_ACCESS_KEY_ID, OSS_ACCESS_KEY_SECRET, OSS_BUCKET).'
      )
    );
  }

  // Validate required fields
  validateConfig(config as OSSConfig);

  return config as OSSConfig;
}

/**
 * Validate OSS configuration
 */
function validateConfig(config: OSSConfig): void {
  const requiredFields: (keyof OSSConfig)[] = [
    'region',
    'accessKeyId',
    'accessKeySecret',
    'bucket',
  ];
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!config[field]) {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new Error(chalk.red(`Missing required configuration fields: ${missing.join(', ')}`));
  }

  // Validate region format
  if (config.region && !config.region.startsWith('oss-')) {
    console.warn(
      chalk.yellow(
        `Warning: Region "${config.region}" doesn't follow the standard format (e.g., "oss-cn-hangzhou")`
      )
    );
  }
}

/**
 * Create a sample configuration file
 */
export function createSampleConfig(outputPath: string = '.ossrc.json', type?: string): void {
  const absolutePath = path.resolve(outputPath);

  if (fs.existsSync(absolutePath)) {
    throw new Error(chalk.red(`Config file already exists: ${absolutePath}`));
  }

  // Determine file type from extension or explicit type option
  const ext = path.extname(absolutePath);
  const fileType = type || (ext === '.js' ? 'js' : 'json');

  let content: string;

  if (fileType === 'js') {
    // Generate JavaScript config with environment variable support
    content = `// OSS Uploader Configuration
// You can use environment variables or hardcoded values

export default {
  // Required fields
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
`;
  } else {
    // Generate JSON config
    const sampleConfig: OSSConfig = {
      region: 'YOUR_REGION',
      accessKeyId: 'YOUR_ACCESS_KEY_ID',
      accessKeySecret: 'YOUR_ACCESS_KEY_SECRET',
      bucket: 'YOUR_BUCKET_NAME',
      secure: true,
      timeout: 60000,
    };
    content = JSON.stringify(sampleConfig, null, 2);
  }

  fs.writeFileSync(absolutePath, content, 'utf-8');
  console.log(chalk.green(`✓ Sample configuration created: ${absolutePath}`));

  if (fileType === 'js') {
    console.log(
      chalk.cyan('💡 JavaScript config supports environment variables with fallback values.')
    );
    console.log(chalk.yellow('Please set environment variables or update the fallback values.'));
  } else {
    console.log(chalk.yellow('Please update the configuration with your actual credentials.'));
    console.log(
      chalk.cyan(
        '💡 Tip: Use `oss-uploader init -o oss.config.js` to generate a JS config that supports environment variables.'
      )
    );
  }
}
