import OSS from 'ali-oss';
import { type OSSConfig, type UploadOptions, type UploadResult, type UploadMapping } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import cliProgress from 'cli-progress';

// Constants
const MAX_FILENAME_DISPLAY_LENGTH = 40;
const DEFAULT_TIMEOUT = 60000;

/**
 * OSS Uploader class
 */
export class OSSUploader {
  private client: OSS;
  private config: OSSConfig;

  constructor(config: OSSConfig) {
    this.config = config;
    this.client = new OSS({
      region: config.region,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      bucket: config.bucket,
      endpoint: config.endpoint,
      internal: config.internal,
      secure: config.secure !== false, // Default to true
      timeout: config.timeout || DEFAULT_TIMEOUT,
    });
  }

  /**
   * Generate OSS URL for a given path
   * Properly encodes URL path segments including Chinese characters
   */
  private generateUrl(ossPath: string): string {
    const secure = this.config.secure !== false;
    const protocol = secure ? 'https' : 'http';
    const endpoint = this.config.endpoint || `${this.config.region}.aliyuncs.com`;

    // Encode each path segment separately to preserve '/' separators
    const encodedPath = ossPath
      .split('/')
      .map(segment => encodeURIComponent(segment))
      .join('/');

    return `${protocol}://${this.config.bucket}.${endpoint}/${encodedPath}`;
  }

  /**
   * Normalize path to use forward slashes
   */
  private normalizePath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
  }

  /**
   * Truncate filename for display
   */
  private truncateFilename(filename: string): string {
    if (filename.length <= MAX_FILENAME_DISPLAY_LENGTH) {
      return filename;
    }
    return '...' + filename.slice(-(MAX_FILENAME_DISPLAY_LENGTH - 3));
  }

  /**
   * Check if file exists in OSS
   * @returns true if exists, false if not exists
   * @throws Error if check fails for other reasons
   */
  private async fileExistsInOSS(remotePath: string): Promise<boolean> {
    try {
      await this.client.head(remotePath);
      return true;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Collect files based on patterns
   */
  private async collectFiles(
    localDir: string,
    include?: string[],
    exclude?: string[]
  ): Promise<string[]> {
    const patterns = include && include.length > 0 ? include : ['**/*'];
    const ignorePatterns = exclude || [];

    let allFiles: string[] = [];
    for (const pattern of patterns) {
      const fullPattern = path.join(localDir, pattern);
      const files = await glob(fullPattern, {
        nodir: true,
        ignore: ignorePatterns,
        absolute: true,
      });
      allFiles = allFiles.concat(files);
    }

    // Remove duplicates
    return [...new Set(allFiles)];
  }

  /**
   * Create progress bar for batch upload
   */
  private createProgressBar(): cliProgress.SingleBar {
    return new cliProgress.SingleBar(
      {
        format:
          'Upload Progress |' +
          chalk.cyan('{bar}') +
          '| {percentage}% | {value}/{total} Files | {currentFile}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true,
      },
      cliProgress.Presets.shades_classic
    );
  }

  /**
   * Upload file or directory to OSS
   */
  async upload(options: UploadOptions): Promise<UploadResult[]> {
    const {
      source,
      target = '',
      recursive = true,
      overwrite = true,
      include,
      exclude,
      verbose = false,
    } = options;

    if (!fs.existsSync(source)) {
      throw new Error(chalk.red(`Source path does not exist: ${source}`));
    }

    const stats = fs.statSync(source);
    const results: UploadResult[] = [];

    if (stats.isFile()) {
      // Upload single file
      const result = await this.uploadFile(source, target, overwrite, verbose);
      results.push(result);
    } else if (stats.isDirectory()) {
      // Upload directory
      if (!recursive) {
        throw new Error(
          chalk.red('Source is a directory. Use --recursive flag to upload directories.')
        );
      }
      const dirResults = await this.uploadDirectory(
        source,
        target,
        overwrite,
        include,
        exclude,
        verbose
      );
      results.push(...dirResults);
    } else {
      throw new Error(chalk.red(`Invalid source: ${source}`));
    }

    // Generate mapping file if requested
    if (options.generateMapping !== false) {
      await this.generateMappingFile(results, options.mappingFile);
    }

    return results;
  }

  /**
   * Upload a single file
   */
  private async uploadFile(
    localPath: string,
    remotePath: string,
    overwrite: boolean = true,
    verbose: boolean = false
  ): Promise<UploadResult> {
    const fileName = path.basename(localPath);
    const ossPath = remotePath ? path.posix.join(remotePath, fileName) : fileName;
    const normalizedOssPath = this.normalizePath(ossPath);

    const spinner = verbose
      ? ora(`Uploading ${chalk.cyan(localPath)} → ${chalk.cyan(normalizedOssPath)}`).start()
      : null;

    try {
      // Check if file exists in OSS when overwrite is disabled
      if (!overwrite && (await this.fileExistsInOSS(normalizedOssPath))) {
        spinner?.fail();
        return {
          success: false,
          localPath,
          remotePath: normalizedOssPath,
          error: 'File already exists (use --overwrite to replace)',
        };
      }

      // Upload file
      await this.client.put(normalizedOssPath, localPath);
      const stats = fs.statSync(localPath);

      spinner?.succeed();

      if (verbose) {
        console.log(
          chalk.green(
            `✓ Uploaded: ${localPath} → ${normalizedOssPath} (${this.formatBytes(stats.size)})`
          )
        );
      }

      return {
        success: true,
        localPath,
        remotePath: normalizedOssPath,
        url: this.generateUrl(normalizedOssPath),
        size: stats.size,
      };
    } catch (error: any) {
      spinner?.fail();

      if (verbose) {
        console.error(chalk.red(`✗ Failed: ${localPath} - ${error.message}`));
      }

      return {
        success: false,
        localPath,
        remotePath: normalizedOssPath,
        error: error.message,
      };
    }
  }

  /**
   * Upload a single file in batch upload context (with progress tracking)
   */
  private async uploadSingleFileInBatch(
    file: string,
    localDir: string,
    remoteDir: string,
    overwrite: boolean,
    verbose: boolean,
    spinner: Ora | null
  ): Promise<UploadResult> {
    const relativePath = path.relative(localDir, file);
    const remotePath = remoteDir
      ? this.normalizePath(path.posix.join(remoteDir, relativePath))
      : this.normalizePath(relativePath);

    try {
      // Check if file exists in OSS when overwrite is disabled
      if (!overwrite && (await this.fileExistsInOSS(remotePath))) {
        spinner?.fail();
        return {
          success: false,
          localPath: file,
          remotePath,
          error: 'File already exists',
        };
      }

      // Upload file
      await this.client.put(remotePath, file);
      const stats = fs.statSync(file);

      spinner?.succeed();

      if (verbose) {
        console.log(
          chalk.green(`✓ ${relativePath} → ${remotePath} (${this.formatBytes(stats.size)})`)
        );
      }

      return {
        success: true,
        localPath: file,
        remotePath,
        url: this.generateUrl(remotePath),
        size: stats.size,
      };
    } catch (error: any) {
      spinner?.fail();

      if (verbose) {
        console.error(chalk.red(`✗ ${relativePath} - ${error.message}`));
      }

      return {
        success: false,
        localPath: file,
        remotePath,
        error: error.message,
      };
    }
  }

  /**
   * Upload a directory recursively
   */
  private async uploadDirectory(
    localDir: string,
    remoteDir: string,
    overwrite: boolean = true,
    include?: string[],
    exclude?: string[],
    verbose: boolean = false
  ): Promise<UploadResult[]> {
    // Collect all files
    const allFiles = await this.collectFiles(localDir, include, exclude);
    const totalFiles = allFiles.length;

    console.log(chalk.blue(`Found ${totalFiles} file(s) to upload from ${localDir}\n`));

    if (totalFiles === 0) {
      return [];
    }

    // Create progress bar (only in non-verbose mode)
    const progressBar = verbose ? null : this.createProgressBar();
    progressBar?.start(totalFiles, 0, { currentFile: '' });

    const results: UploadResult[] = [];
    let uploadedCount = 0;

    for (const file of allFiles) {
      const relativePath = path.relative(localDir, file);
      const truncatedPath = this.truncateFilename(relativePath);

      // Update progress bar with current file
      progressBar?.update(uploadedCount, { currentFile: truncatedPath });

      // Create spinner for verbose mode
      const spinner = verbose ? ora(`Uploading ${chalk.cyan(relativePath)}`).start() : null;

      // Upload single file
      const result = await this.uploadSingleFileInBatch(
        file,
        localDir,
        remoteDir,
        overwrite,
        verbose,
        spinner
      );

      results.push(result);
      uploadedCount++;

      // Update progress bar
      progressBar?.update(uploadedCount, { currentFile: truncatedPath });
    }

    progressBar?.stop();
    console.log(); // Add a newline after progress bar

    return results;
  }

  /**
   * Upload multiple files from different source paths
   */
  async uploadMultiple(
    sources: string[],
    targetDir: string = '',
    overwrite: boolean = true,
    verbose: boolean = false
  ): Promise<UploadResult[]> {
    console.log(chalk.blue(`Found ${sources.length} source(s) to upload\n`));

    const results: UploadResult[] = [];

    // Create progress bar (only in non-verbose mode)
    const progressBar = verbose ? null : this.createProgressBar();
    const totalSources = sources.length;
    progressBar?.start(totalSources, 0, { currentFile: '' });

    let processedCount = 0;

    for (const source of sources) {
      const sourcePath = path.resolve(source);

      if (!fs.existsSync(sourcePath)) {
        console.error(chalk.red(`✗ Source does not exist: ${sourcePath}`));
        results.push({
          success: false,
          localPath: sourcePath,
          remotePath: '',
          error: 'Source path does not exist',
        });
        processedCount++;
        progressBar?.update(processedCount, { currentFile: path.basename(sourcePath) });
        continue;
      }

      const stats = fs.statSync(sourcePath);
      const fileName = path.basename(sourcePath);

      progressBar?.update(processedCount, { currentFile: this.truncateFilename(fileName) });

      if (stats.isFile()) {
        const spinner = verbose ? ora(`Uploading ${chalk.cyan(fileName)}`).start() : null;
        const result = await this.uploadFile(sourcePath, targetDir, overwrite, verbose);
        results.push(result);
        spinner?.stop();
      } else if (stats.isDirectory()) {
        console.log(chalk.blue(`\nUploading directory: ${sourcePath}`));
        const dirResults = await this.uploadDirectory(
          sourcePath,
          targetDir,
          overwrite,
          undefined, // no include patterns in multi-file mode
          undefined, // no exclude patterns in multi-file mode
          verbose
        );
        results.push(...dirResults);
      } else {
        results.push({
          success: false,
          localPath: sourcePath,
          remotePath: '',
          error: 'Invalid source type',
        });
      }

      processedCount++;
      progressBar?.update(processedCount, { currentFile: this.truncateFilename(fileName) });
    }

    progressBar?.stop();
    console.log(); // Add a newline after progress bar

    return results;
  }

  /**
   * Generate upload mapping file (now public for CLI usage)
   */
  async generateMappingFile(results: UploadResult[], customPath?: string): Promise<void> {
    const successfulResults = results.filter(r => r.success && r.url);

    if (successfulResults.length === 0) {
      return;
    }

    const now = new Date();
    const mappings: UploadMapping[] = successfulResults.map(result => ({
      localPath: result.localPath,
      remotePath: result.remotePath,
      url: result.url!,
      size: result.size || 0,
      sizeFormatted: this.formatBytes(result.size || 0),
      uploadTime: now.toISOString(),
      uploadTimeLocal: this.formatLocalTime(now),
    }));

    const mappingPath = customPath || path.join(process.cwd(), '.oss-uploader-mapping.json');

    const totalSize = mappings.reduce((sum, m) => sum + m.size, 0);
    const mappingData = {
      uploadTime: now.toISOString(),
      uploadTimeLocal: this.formatLocalTime(now),
      bucket: this.config.bucket,
      region: this.config.region,
      totalFiles: mappings.length,
      totalSize,
      totalSizeFormatted: this.formatBytes(totalSize),
      files: mappings,
    };

    await fs.promises.writeFile(mappingPath, JSON.stringify(mappingData, null, 2), 'utf-8');

    console.log(chalk.green(`\n✓ Upload mapping saved to: ${mappingPath}`));
  }

  /**
   * List files in OSS bucket
   */
  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<OSS.ObjectMeta[]> {
    try {
      const result = await this.client.list({
        prefix: prefix || '',
        'max-keys': maxKeys,
      });

      return result.objects || [];
    } catch (error: any) {
      throw new Error(chalk.red(`Failed to list files: ${error.message}`));
    }
  }

  /**
   * Delete a file from OSS
   */
  async deleteFile(ossPath: string): Promise<void> {
    try {
      await this.client.delete(ossPath);
      console.log(chalk.green(`✓ Deleted: ${ossPath}`));
    } catch (error: any) {
      throw new Error(chalk.red(`Failed to delete file: ${error.message}`));
    }
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format date to local time string
   * Returns a readable local time format: YYYY-MM-DD HH:mm:ss
   */
  private formatLocalTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get bucket info
   */
  async getBucketInfo(): Promise<any> {
    try {
      const result = await this.client.getBucketInfo();
      return result;
    } catch (error: any) {
      throw new Error(chalk.red(`Failed to get bucket info: ${error.message}`));
    }
  }
}
