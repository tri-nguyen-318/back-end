import { Injectable } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';
import { PublisherService } from 'src/rabbitmq/publisher.service';

@Injectable()
export class UploadService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly publisherService: PublisherService,
  ) {}

  async uploadToS3(files: Express.Multer.File[]) {
    // 👈 Remove decorator
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    try {
      const uploadPromises = files.map((file) => {
        // Pass file.buffer instead of the file object
        return this.s3Service.uploadFile(file.buffer, file.originalname);
      });

      const results = await Promise.all(uploadPromises);

      return {
        message: 'Files uploaded successfully',
        files: results,
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  async uploadVideosToS3(files: Express.Multer.File[]) {
    // 👈 Remove decorator
    if (!files || files.length === 0) {
      throw new Error('No files provided for upload');
    }

    // It's might be heavy operation, so we can use a message queue to handle it asynchronously
    try {
      // Publish the upload results to RabbitMQ
      await this.publisherService.publishToQueue(
        { event: 'video_to_uploaded', test: 'test' },
        'video_to_uploaded',
      );

      // Move this to comsumer
      this.uploadToS3(files);

      return {
        message: 'Files uploaded successfully',
        files: [],
      };
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}
