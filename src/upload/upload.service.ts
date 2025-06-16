import { Injectable } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UploadService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadToS3(file: Express.Multer.File) {
    // 👈 Remove decorator
    if (!file?.buffer) {
      throw new Error('Invalid file provided');
    }

    try {
      return await this.s3Service.uploadFile(file.buffer, file.originalname);
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}
