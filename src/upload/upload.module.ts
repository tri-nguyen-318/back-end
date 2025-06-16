import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { S3Module } from 'src/s3/s3.module';
import { UploadController } from './upload.controller';

@Module({
  imports: [S3Module],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
