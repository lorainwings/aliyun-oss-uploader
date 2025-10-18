import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, createSampleConfig } from './config';
import { OSSUploader } from './uploader';
import { type UploadOptions } from './types';
import * as path from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

// Package info
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

program
  .name('oss-uploader')
  .description('OSS Uploader - A powerful CLI tool for uploading files to Aliyun OSS')
  .version(packageJson.version);

// Upload command
program
  .command('upload <source>')
  .description('Upload a file or directory to OSS')
  .option('-t, --target <path>', 'Target path in OSS bucket', '')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-r, --recursive', 'Upload directory recursively', true)
  .option('-o, --overwrite', 'Overwrite existing files', true)
  .option('--no-overwrite', 'Do not overwrite existing files')
  .option('-i, --include <patterns...>', 'Include file patterns (glob)')
  .option('-e, --exclude <patterns...>', 'Exclude file patterns (glob)')
  .option('-v, --verbose', 'Show verbose output', false)
  .option(
    '-m, --mapping [path]',
    'Generate upload mapping file (default: .oss-uploader-mapping.json)'
  )
  .option('--no-mapping', 'Do not generate upload mapping file')
  .action(async (source: string, options: any) => {
    try {
      console.log(chalk.blue('🚀 Starting upload process...\n'));

      // Load configuration
      const config = await loadConfig(options.config);

      if (options.verbose) {
        console.log(
          chalk.gray(`Config loaded: Region=${config.region}, Bucket=${config.bucket}\n`)
        );
      }

      // Create uploader instance
      const uploader = new OSSUploader(config);

      // Prepare upload options
      const uploadOptions: UploadOptions = {
        source: path.resolve(source),
        target: options.target,
        recursive: options.recursive,
        overwrite: options.overwrite,
        include: options.include,
        exclude: options.exclude,
        verbose: options.verbose,
        generateMapping: options.mapping !== false,
        mappingFile: typeof options.mapping === 'string' ? options.mapping : undefined,
      };

      // Upload files
      const results = await uploader.upload(uploadOptions);

      // Print summary
      console.log(chalk.blue('\n📊 Upload Summary:'));
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      const totalSize = results
        .filter(r => r.success && r.size)
        .reduce((sum, r) => sum + (r.size || 0), 0);

      console.log(chalk.green(`✓ Successful: ${successful}`));
      if (failed > 0) {
        console.log(chalk.red(`✗ Failed: ${failed}`));
      }
      console.log(chalk.gray(`Total size: ${formatBytes(totalSize)}`));

      if (failed > 0) {
        console.log(chalk.yellow('\nFailed files:'));
        results
          .filter(r => !r.success)
          .forEach(r => {
            console.log(chalk.red(`  ✗ ${r.localPath}: ${r.error}`));
          });
        process.exit(1);
      }

      console.log(chalk.green('\n✨ Upload completed successfully!'));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// List command
program
  .command('list [prefix]')
  .description('List files in OSS bucket')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-m, --max-keys <number>', 'Maximum number of files to list', '1000')
  .action(async (prefix: string | undefined, options: any) => {
    try {
      // Load configuration
      const config = await loadConfig(options.config);
      const uploader = new OSSUploader(config);

      console.log(chalk.blue(`📂 Listing files in bucket: ${config.bucket}\n`));

      const files = await uploader.listFiles(prefix, parseInt(options.maxKeys));

      if (files.length === 0) {
        console.log(chalk.yellow('No files found.'));
        return;
      }

      console.log(chalk.green(`Found ${files.length} file(s):\n`));
      files.forEach(file => {
        const size = formatBytes(file.size);
        console.log(`  ${chalk.cyan(file.name)} ${chalk.gray(`(${size})`)}`);
      });
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Delete command
program
  .command('delete <path>')
  .description('Delete a file from OSS bucket')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (ossPath: string, options: any) => {
    try {
      // Load configuration
      const config = await loadConfig(options.config);
      const uploader = new OSSUploader(config);

      console.log(chalk.yellow(`⚠️  Deleting file: ${ossPath}`));
      await uploader.deleteFile(ossPath);
      console.log(chalk.green('✨ File deleted successfully!'));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Init command - create sample config
program
  .command('init')
  .description('Create a sample configuration file')
  .option('-o, --output <path>', 'Output path for configuration file', '.ossrc.json')
  .option(
    '-t, --type <type>',
    'Configuration file type: json or js (default: auto-detect from output path)'
  )
  .action((options: any) => {
    try {
      createSampleConfig(options.output, options.type);
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show bucket information')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options: any) => {
    try {
      // Load configuration
      const config = await loadConfig(options.config);
      const uploader = new OSSUploader(config);

      console.log(chalk.blue('📦 Bucket Information:\n'));
      const info = await uploader.getBucketInfo();

      console.log(chalk.cyan('Bucket:'), info.bucket);
      console.log(chalk.cyan('Region:'), config.region);
      console.log(chalk.green('\n✨ Connection successful!'));
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Helper function
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// Parse arguments
program.parse(process.argv);

// Show help if no command specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
