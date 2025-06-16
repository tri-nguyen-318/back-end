import {
  BadRequestException,
  Controller,
  Post,
  Res,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { Response } from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('images')
  @UseInterceptors(FilesInterceptor('files')) // Note plural 'files'
  async uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
    return this.uploadService.uploadToS3(files);
  }

  async uploadVideo(
    @UploadedFile() video: Express.Multer.File,
    @Res() res: Response,
  ) {
    if (!video) {
      throw new BadRequestException('No video file provided');
    }

    try {
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify({ status: 'started', progress: 0 }));

      const result = await this.uploadService.uploadVideo(video, (progress) => {
        res.write(JSON.stringify({ status: 'uploading', progress }));
      });

      res.end(
        JSON.stringify({
          status: 'completed',
          location: result.location,
        }),
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
