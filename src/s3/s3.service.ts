import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3;
  private readonly bucketName: string;
  private currentKey: string = '';

  constructor() {
    this.s3 = new S3({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
      s3ForcePathStyle: true,
      signatureVersion: 'v4',
    });
    this.bucketName = process.env.MINIO_BUCKET_NAME || 'default-bucket';
    this.initializeBucket();
  }

  private async initializeBucket() {
    try {
      await this.s3.headBucket({ Bucket: this.bucketName }).promise();
      this.logger.log(`Bucket ${this.bucketName} already exists`);
    } catch (error) {
      if (error.code === 'NotFound') {
        await this.s3.createBucket({ Bucket: this.bucketName }).promise();
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

      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucketName,
          Body: dataBuffer,
          Key: `${uuid()}-${filename.replace(/\s+/g, '-')}`,
        })
        .promise();

      return {
        key: uploadResult.Key,
        url: uploadResult.Location,
      };
    } catch (error) {
      this.logger.error('Upload error', error.stack);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async uploadLargeFile(
    file: Express.Multer.File,
    progressCallback?: (progress: number) => void,
  ) {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
    const uploadId = await this.initiateMultipartUpload(file.originalname);

    try {
      const parts = await this.uploadParts(file.buffer, uploadId, CHUNK_SIZE);
      const result = await this.completeUpload(uploadId, parts);

      if (progressCallback) {
        const totalParts = parts.length;
        for (let i = 0; i < totalParts; i++) {
          const progress = ((i + 1) / totalParts) * 100;
          progressCallback(progress);
        }
      }

      return {
        location: result.Location,
        key: result.Key,
        etag: result.ETag,
      };
    } catch (error) {
      await this.abortUpload(uploadId);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  private async initiateMultipartUpload(filename: string): Promise<string> {
    this.currentKey = `${uuid()}-${filename.replace(/\s+/g, '-')}`;
    const response = await this.s3
      .createMultipartUpload({
        Bucket: this.bucketName,
        Key: this.currentKey,
      })
      .promise();
    return response.UploadId as string;
  }

  private async uploadParts(
    buffer: Buffer,
    uploadId: string,
    chunkSize: number,
  ): Promise<Array<{ PartNumber: number; ETag: string }>> {
    const partPromises: Array<Promise<{ PartNumber: number; ETag: string }>> =
      [];
    let partNumber = 1;

    for (let offset = 0; offset < buffer.length; offset += chunkSize) {
      const chunk = buffer.slice(offset, offset + chunkSize);
      const currentPartNumber = partNumber++;

      const uploadPromise = this.s3
        .uploadPart({
          Bucket: this.bucketName,
          Key: this.currentKey,
          PartNumber: currentPartNumber,
          UploadId: uploadId,
          Body: chunk,
        })
        .promise()
        .then((result) => ({
          PartNumber: currentPartNumber,
          ETag: result.ETag as string,
        }));

      partPromises.push(uploadPromise);
    }

    return Promise.all(partPromises);
  }

  private async completeUpload(
    uploadId: string,
    parts: Array<{ PartNumber: number; ETag: string }>,
  ) {
    return this.s3
      .completeMultipartUpload({
        Bucket: this.bucketName,
        Key: this.currentKey,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.map((part) => ({
            ETag: part.ETag,
            PartNumber: part.PartNumber,
          })),
        },
      })
      .promise();
  }

  private async abortUpload(uploadId: string) {
    if (!this.currentKey) return;
    await this.s3
      .abortMultipartUpload({
        Bucket: this.bucketName,
        Key: this.currentKey,
        UploadId: uploadId,
      })
      .promise();
  }
}
