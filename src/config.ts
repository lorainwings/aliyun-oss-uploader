import { cosmiconfigSync } from 'cosmiconfig';
import { type OSSConfig } from './types';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs';
import { pathToFileURL } from 'url';

const CONFIG_MODULE_NAME = 'oss';

/**
 * Load OSS configuration from various sources
 * Supports: .ossrc, .ossrc.json, .ossrc.yaml, .ossrc.yml, oss.config.js, package.json
 */
export async function loadConfig(configPath?: string): Promise<OSSConfig> {
  let config: OSSConfig | null = null;

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

  if (!config) {
    throw new Error(
      chalk.red('No configuration found. Please create a .ossrc.json or specify config path.')
    );
  }

  // Validate required fields
  validateConfig(config);

  return config;
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
export function createSampleConfig(outputPath: string = '.ossrc.json'): void {
  const sampleConfig: OSSConfig = {
    region: 'oss-cn-hangzhou',
    accessKeyId: 'YOUR_ACCESS_KEY_ID',
    accessKeySecret: 'YOUR_ACCESS_KEY_SECRET',
    bucket: 'YOUR_BUCKET_NAME',
    secure: true,
    timeout: 60000,
  };

  const absolutePath = path.resolve(outputPath);

  if (fs.existsSync(absolutePath)) {
    throw new Error(chalk.red(`Config file already exists: ${absolutePath}`));
  }

  fs.writeFileSync(absolutePath, JSON.stringify(sampleConfig, null, 2), 'utf-8');
  console.log(chalk.green(`✓ Sample configuration created: ${absolutePath}`));
  console.log(chalk.yellow('Please update the configuration with your actual credentials.'));
}
