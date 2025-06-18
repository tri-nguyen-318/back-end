import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadModule } from './upload/upload.module';
import { S3Service } from './s3/s3.service';
import { S3Module } from './s3/s3.module';
import { ConfigModule } from '@nestjs/config';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { AssetModule } from './asset/asset.module';
import rabbitmqConfig from './config/rabbitmq.config';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [rabbitmqConfig],
    }),
    UploadModule,
    S3Module,
    RabbitmqModule,
    PrismaModule,
    AssetModule,
  ],
  controllers: [AppController],
  providers: [AppService, S3Service, PrismaService],
})
export class AppModule {}
