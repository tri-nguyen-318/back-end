import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { v4 } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor() {
    this.s3 = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      },
      forcePathStyle: true, // Note: changed from s3ForcePathStyle to forcePathStyle
      region: process.env.AWS_REGION || 'us-east-1', // Required for S3Client
    });
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'default-bucket';
  }

  private async initializeBucket() {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }));
      this.logger.log(`Bucket ${this.bucketName} already exists`);
    } catch (error) {
      if (error.name === 'NotFound') {
        await this.s3.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        this.logger.log(`Created bucket ${this.bucketName}`);
      } else {
        this.logger.error('Bucket initialization error', error.stack);
        throw error;
      }
    }
  }

  async uploadFile(dataBuffer: Buffer, filename: string) {
    try {
      await this.initializeBucket(); // Ensure bucket exists

      const key = `${v4()}-${filename.replace(/\s+/g, '-')}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Body: dataBuffer,
          Key: key,
        }),
      );

      // Note: For MinIO, you might need to construct the URL manually
      const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
      const url = `${endpoint}/${this.bucketName}/${key}`;

      return {
        key,
        url,
      };
    } catch (error) {
      this.logger.error('Upload error', error.stack);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async startMultipartUpload(filename: string) {
    await this.initializeBucket();
    const key = `${v4()}-${filename.replace(/\s+/g, '-')}`;
    const response = await this.s3.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
    return { uploadId: response.UploadId, key };
  }

  async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    chunk: Buffer,
  ) {
    const response = await this.s3.send(
      new UploadPartCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: chunk,
      }),
    );
    return { ETag: response.ETag, PartNumber: partNumber };
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>,
  ) {
    await this.s3.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      }),
    );

    const endpoint = process.env.MINIO_ENDPOINT || 'http://localhost:9000';
    const url = `${endpoint}/${this.bucketName}/${key}`;

    return { key, url };
  }

  async abortMultipartUpload(key: string, uploadId: string) {
    await this.s3.send(
      new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: key,
        UploadId: uploadId,
      }),
    );
  }
}
