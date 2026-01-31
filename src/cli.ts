import { Command } from 'commander';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
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
  .command('upload <sources...>')
  .description('Upload file(s) or directory to OSS (supports multiple file paths)')
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
  .option('-h, --content-hash', 'Add content hash to filename (default: true)', true)
  .option('--no-content-hash', 'Do not add content hash to filename')
  .action(async (sources: string[], options: any) => {
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

      let results: any[] = [];

      if (sources.length === 1 && sources[0]) {
        // Single source - use original logic (support directory upload with patterns)
        const uploadOptions: UploadOptions = {
          source: path.resolve(sources[0]),
          target: options.target,
          recursive: options.recursive,
          overwrite: options.overwrite,
          include: options.include,
          exclude: options.exclude,
          verbose: options.verbose,
          generateMapping: options.mapping !== false,
          mappingFile: typeof options.mapping === 'string' ? options.mapping : undefined,
          contentHash: options.contentHash !== false,
        };
        results = await uploader.upload(uploadOptions);
      } else {
        // Multiple sources - batch upload multiple files/directories
        console.log(chalk.blue(`Uploading ${sources.length} source(s)...\n`));
        results = await uploader.uploadMultiple(
          sources.map(s => path.resolve(s)),
          options.target,
          options.overwrite,
          options.verbose,
          options.contentHash !== false
        );

        // Generate mapping file if requested
        if (options.mapping !== false) {
          const mappingFile = typeof options.mapping === 'string' ? options.mapping : undefined;
          await uploader.generateMappingFile(results, mappingFile);
        }
      }

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
  .description('List files and directories in OSS bucket')
  .option('-c, --config <path>', 'Path to configuration file')
  .option('-m, --max-keys <number>', 'Maximum number of files to list', '1000')
  .option('-d, --dirs', 'Show directories only (useful for choosing upload target)', false)
  .action(async (prefix: string | undefined, options: any) => {
    try {
      // Load configuration
      const config = await loadConfig(options.config);
      const uploader = new OSSUploader(config);

      const displayPrefix = prefix || '/';
      console.log(chalk.blue(`📂 Listing in bucket: ${config.bucket}/${displayPrefix}\n`));

      if (options.dirs) {
        // Show directories and files at current level
        const { directories, files } = await uploader.listDirectories(prefix);

        if (directories.length === 0 && files.length === 0) {
          console.log(chalk.yellow('No directories or files found.'));
          return;
        }

        if (directories.length > 0) {
          console.log(chalk.green(`Directories (${directories.length}):\n`));
          directories.forEach(dir => {
            console.log(`  ${chalk.cyan('📁 ' + dir)}`);
          });
        }

        if (files.length > 0) {
          console.log(chalk.green(`\nFiles (${files.length}):\n`));
          files.forEach(file => {
            const size = formatBytes(file.size);
            console.log(`  ${chalk.white('📄 ' + file.name)} ${chalk.gray(`(${size})`)}`);
          });
        }
      } else {
        // Original behavior: list all files recursively
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
      }
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

// Interactive browse function
async function browseOSS(
  uploader: OSSUploader,
  bucket: string,
  startPrefix: string = ''
): Promise<string | null> {
  let currentPrefix = startPrefix;

  while (true) {
    const { directories, files } = await uploader.listDirectories(currentPrefix);

    const choices: { name: string; value: string }[] = [];

    // Add "select current directory" option
    choices.push({
      name: chalk.green(`✓ Select current directory: ${currentPrefix || '/'}`),
      value: '__SELECT__',
    });

    // Add "go back" option if not at root
    if (currentPrefix) {
      choices.push({
        name: chalk.yellow('⬆ .. (Go back)'),
        value: '__BACK__',
      });
    }

    // Add "exit" option
    choices.push({
      name: chalk.red('✗ Exit'),
      value: '__EXIT__',
    });

    // Add directories
    for (const dir of directories) {
      const displayName = dir.replace(currentPrefix, '');
      choices.push({
        name: chalk.cyan(`📁 ${displayName}`),
        value: dir,
      });
    }

    // Add files (for display only)
    for (const file of files.slice(0, 10)) {
      const displayName = file.name.replace(currentPrefix, '');
      const size = formatBytes(file.size);
      choices.push({
        name: chalk.gray(`   📄 ${displayName} (${size})`),
        value: '__FILE__',
      });
    }

    if (files.length > 10) {
      choices.push({
        name: chalk.gray(`   ... and ${files.length - 10} more files`),
        value: '__FILE__',
      });
    }

    console.log(chalk.blue(`\n📂 Browsing: ${bucket}/${currentPrefix || ''}\n`));

    const answer = await select({
      message: 'Select a directory:',
      choices,
      pageSize: 15,
    });

    if (answer === '__SELECT__') {
      return currentPrefix;
    } else if (answer === '__EXIT__') {
      return null;
    } else if (answer === '__BACK__') {
      // Go to parent directory
      const parts = currentPrefix.replace(/\/$/, '').split('/');
      parts.pop();
      currentPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
    } else if (answer === '__FILE__') {
      // Ignore file selection
      console.log(chalk.yellow('Files cannot be selected as upload target.'));
    } else {
      // Enter selected directory
      currentPrefix = answer;
    }
  }
}

// Browse command
program
  .command('browse [prefix]')
  .description('Interactively browse OSS directories')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (prefix: string | undefined, options: any) => {
    try {
      const config = await loadConfig(options.config);
      const uploader = new OSSUploader(config);

      const selectedPath = await browseOSS(uploader, config.bucket, prefix || '');

      if (selectedPath !== null) {
        console.log(chalk.green(`\n✓ Selected path: ${selectedPath || '/'}`));
        console.log(chalk.gray(`\nUse this path with upload command:`));
        console.log(chalk.cyan(`  oss-uploader upload <source> -t "${selectedPath}"`));
      } else {
        console.log(chalk.yellow('\nBrowsing cancelled.'));
      }
    } catch (error: any) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
