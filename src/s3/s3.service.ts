import { Injectable, Logger } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuid } from 'uuid';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: S3;

  constructor() {
    this.s3 = new S3({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000', // From env
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin', // From env
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin123', // From env
      s3ForcePathStyle: true, // Required for MinIO
      signatureVersion: 'v4',
    });
  }

  async uploadFile(
    dataBuffer: Buffer,
    filename: string,
  ): Promise<{ key: string; url: string }> {
    try {
      const uploadResult = await this.s3
        .upload({
          Bucket: process.env.MINIO_BUCKET_NAME || 'default-bucket', // Fallback bucket
          Body: dataBuffer,
          Key: `${uuid()}-${filename.replace(/\s+/g, '-')}`, // Sanitize filename
        })
        .promise();

      this.logger.log(`File uploaded successfully: ${uploadResult.Key}`);

      return {
        key: uploadResult.Key,
        url: uploadResult.Location, // MinIO returns Location even locally
      };
    } catch (error) {
      this.logger.error('Error uploading file to MinIO', error.stack);
      throw new Error('Failed to upload file');
    }
  }
}
