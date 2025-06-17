import { Module } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { PublisherService } from './publisher.service';
import { ConsumerService } from './consumer.service';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from 'src/config/rabbitmq.config';

@Module({
  imports: [ConfigModule.forFeature(rabbitmqConfig)],
  providers: [ConnectionService, PublisherService, ConsumerService],
  exports: [PublisherService, ConsumerService],
})
export class RabbitmqModule {}
