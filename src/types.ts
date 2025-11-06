/**
 * OSS Configuration interface
 */
export interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  /** Optional: Custom endpoint */
  endpoint?: string;
  /** Optional: Whether to use internal endpoint */
  internal?: boolean;
  /** Optional: Whether to use HTTPS */
  secure?: boolean;
  /** Optional: Connection timeout in milliseconds */
  timeout?: number;
}

/**
 * Upload options
 */
export interface UploadOptions {
  /** Local file or directory path to upload */
  source: string;
  /** Remote directory path in OSS bucket */
  target?: string;
  /** Whether to upload recursively for directories */
  recursive?: boolean;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** File patterns to include (glob patterns) */
  include?: string[];
  /** File patterns to exclude (glob patterns) */
  exclude?: string[];
  /** Whether to show verbose output */
  verbose?: boolean;
  /** Whether to generate upload mapping file */
  generateMapping?: boolean;
  /** Custom mapping file path */
  mappingFile?: string;
  /** Whether to add content hash to filename (default: true) */
  contentHash?: boolean;
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  localPath: string;
  remotePath: string;
  url?: string;
  size?: number;
  error?: string;
}

/**
 * Upload mapping entry
 */
export interface UploadMapping {
  localPath: string;
  remotePath: string;
  url: string;
  size: number;
  sizeFormatted: string;
  uploadTime: string;
  uploadTimeLocal: string;
}
