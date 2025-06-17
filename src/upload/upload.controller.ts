import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('images')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadToS3(files);
  }

  @Post('video')
  @UseInterceptors(FileInterceptor('file')) // Note: FileInterceptor (singular) not FilesInterceptor
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: { fileId: string; segmentIndex: string; totalSegments: string },
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    // You can access the additional metadata from body
    console.log('Upload metadata:', {
      fileId: body.fileId,
      segmentIndex: body.segmentIndex,
      totalSegments: body.totalSegments,
    });

    return this.uploadService.uploadToS3([file]); // Assuming uploadToS3 accepts single file
  }
}
