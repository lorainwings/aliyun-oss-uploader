/**
 * Type definitions for ali-oss
 */
declare module 'ali-oss' {
  namespace OSS {
    interface Options {
      region: string;
      accessKeyId: string;
      accessKeySecret: string;
      bucket: string;
      endpoint?: string;
      internal?: boolean;
      secure?: boolean;
      timeout?: number;
      [key: string]: any;
    }

    interface PutObjectResult {
      name: string;
      url: string;
      res: {
        status: number;
        headers: any;
        [key: string]: any;
      };
      [key: string]: any;
    }

    interface HeadObjectResult {
      status: number;
      res: {
        headers: any;
        [key: string]: any;
      };
      [key: string]: any;
    }

    interface ObjectMeta {
      name: string;
      url: string;
      lastModified: string;
      etag: string;
      type: string;
      size: number;
      storageClass: string;
      owner: {
        id: string;
        displayName: string;
      };
      [key: string]: any;
    }

    interface ListObjectResult {
      objects: ObjectMeta[];
      prefixes: string[];
      isTruncated: boolean;
      nextMarker: string;
      [key: string]: any;
    }

    interface DeleteResult {
      res: {
        status: number;
        headers: any;
        [key: string]: any;
      };
      [key: string]: any;
    }

    interface BucketInfo {
      bucket: {
        name: string;
        location: string;
        creationDate: string;
        extranetEndpoint: string;
        intranetEndpoint: string;
        acl: string;
        dataRedundancyType: string;
        storageClass: string;
        [key: string]: any;
      };
      [key: string]: any;
    }
  }

  class OSS {
    constructor(options: OSS.Options);

    put(
      name: string,
      file: string | Buffer | ReadableStream,
      options?: any
    ): Promise<OSS.PutObjectResult>;

    head(name: string, options?: any): Promise<OSS.HeadObjectResult>;

    list(query?: {
      prefix?: string;
      marker?: string;
      delimiter?: string;
      'max-keys'?: number;
      [key: string]: any;
    }): Promise<OSS.ListObjectResult>;

    delete(name: string, options?: any): Promise<OSS.DeleteResult>;

    deleteMulti(names: string[], options?: any): Promise<any>;

    getBucketInfo(): Promise<OSS.BucketInfo>;

    [key: string]: any;
  }

  export = OSS;
}
