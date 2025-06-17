import { Injectable } from '@nestjs/common';
import { S3Service } from '../s3/s3.service';

@Injectable()
export class UploadService {
  constructor(private readonly s3Service: S3Service) {}

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
}
