import OSS from 'ali-oss';
import { type OSSConfig, type UploadOptions, type UploadResult, type UploadMapping } from './types';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import ora from 'ora';

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
      timeout: config.timeout || 60000,
    });
  }

  /**
   * Generate OSS URL for a given path
   */
  private generateUrl(ossPath: string): string {
    const secure = this.config.secure !== false;
    const protocol = secure ? 'https' : 'http';
    const endpoint = this.config.endpoint || `${this.config.region}.aliyuncs.com`;
    return `${protocol}://${this.config.bucket}.${endpoint}/${ossPath}`;
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

    // Check if source exists
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
    const normalizedOssPath = ossPath.replace(/\\/g, '/'); // Ensure forward slashes

    const spinner = verbose
      ? ora(`Uploading ${chalk.cyan(localPath)} → ${chalk.cyan(normalizedOssPath)}`).start()
      : null;

    try {
      // Check if file exists in OSS
      if (!overwrite) {
        try {
          await this.client.head(normalizedOssPath);
          // File exists
          spinner?.fail();
          return {
            success: false,
            localPath,
            remotePath: normalizedOssPath,
            error: 'File already exists (use --overwrite to replace)',
          };
        } catch (error: any) {
          // File doesn't exist, continue with upload
          if (error.code !== 'NoSuchKey') {
            throw error;
          }
        }
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
    // Build glob pattern
    const patterns = include && include.length > 0 ? include : ['**/*'];
    const ignorePatterns = exclude || [];

    const results: UploadResult[] = [];

    for (const pattern of patterns) {
      const fullPattern = path.join(localDir, pattern);
      const files = await glob(fullPattern, {
        nodir: true,
        ignore: ignorePatterns,
        absolute: true,
      });

      console.log(chalk.blue(`Found ${files.length} file(s) to upload from ${localDir}`));

      for (const file of files) {
        const relativePath = path.relative(localDir, file);
        const remotePath = remoteDir
          ? path.posix.join(remoteDir, relativePath).replace(/\\/g, '/')
          : relativePath.replace(/\\/g, '/');

        const spinner = verbose ? ora(`Uploading ${chalk.cyan(relativePath)}`).start() : null;

        try {
          // Check if file exists in OSS
          if (!overwrite) {
            try {
              await this.client.head(remotePath);
              // File exists
              spinner?.fail();
              results.push({
                success: false,
                localPath: file,
                remotePath,
                error: 'File already exists',
              });
              continue;
            } catch (error: any) {
              // File doesn't exist, continue
              if (error.code !== 'NoSuchKey') {
                throw error;
              }
            }
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

          results.push({
            success: true,
            localPath: file,
            remotePath,
            url: this.generateUrl(remotePath),
            size: stats.size,
          });
        } catch (error: any) {
          spinner?.fail();

          if (verbose) {
            console.error(chalk.red(`✗ ${relativePath} - ${error.message}`));
          }

          results.push({
            success: false,
            localPath: file,
            remotePath,
            error: error.message,
          });
        }
      }
    }

    return results;
  }

  /**
   * Generate upload mapping file
   */
  private async generateMappingFile(results: UploadResult[], customPath?: string): Promise<void> {
    const successfulResults = results.filter(r => r.success && r.url);

    if (successfulResults.length === 0) {
      return;
    }

    const mappings: UploadMapping[] = successfulResults.map(result => ({
      localPath: result.localPath,
      remotePath: result.remotePath,
      url: result.url!,
      size: result.size || 0,
      uploadTime: new Date().toISOString(),
    }));

    const mappingPath = customPath || path.join(process.cwd(), '.oss-uploader-mapping.json');

    const mappingData = {
      uploadTime: new Date().toISOString(),
      bucket: this.config.bucket,
      region: this.config.region,
      totalFiles: mappings.length,
      totalSize: mappings.reduce((sum, m) => sum + m.size, 0),
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
