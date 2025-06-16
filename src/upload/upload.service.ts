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

  private validateFile(file: Express.Multer.File) {
    if (!file.buffer) {
      throw new Error('File buffer is empty');
    }
  }

  private validateVideoFile(file: Express.Multer.File) {
    this.validateFile(file);

    if (!file.mimetype.startsWith('video/')) {
      throw new Error('Only video files are allowed');
    }
  }

  async uploadVideo(
    videoFile: Express.Multer.File,
    progressCallback?: (progress: number) => void,
  ) {
    if (!videoFile) {
      throw new Error('No video file provided');
    }

    this.validateVideoFile(videoFile);

    try {
      return await this.s3Service.uploadLargeFile(videoFile, progressCallback);
    } catch (error) {
      throw new Error(`Video upload failed: ${error.message}`);
    }
  }
}
