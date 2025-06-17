import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { S3Service } from './s3/s3.service';
import { S3Module } from './s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
@Module({
  imports: [ConfigModule.forRoot(), UploadModule, S3Module, RabbitmqModule],
  controllers: [AppController],
  providers: [AppService, S3Service],
})
export class AppModule {}
