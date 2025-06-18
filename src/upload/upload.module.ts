import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { S3Module } from 'src/s3/s3.module';
import { UploadController } from './upload.controller';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';

@Module({
  imports: [S3Module, RabbitmqModule],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
