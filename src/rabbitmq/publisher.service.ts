// src/rabbitmq/publisher.service.ts
import { Injectable } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PublisherService {
  private readonly defaultQueue: string;
  private readonly defaultExchange: string;

  constructor(
    private readonly connectionService: ConnectionService,
    private readonly configService: ConfigService,
  ) {
    const rabbitmqConfig = this.configService.get('rabbitmq');
    this.defaultQueue = rabbitmqConfig.queue;
    this.defaultExchange = rabbitmqConfig.exchange;
  }

  async publishToQueue(message: any, queue?: string) {
    const targetQueue = queue || this.defaultQueue;
    const channel = this.connectionService.getChannel();
    await channel.assertQueue(targetQueue, { durable: true });
    channel.sendToQueue(targetQueue, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
  }

  async publishToExchange(
    message: any,
    routingKey: string,
    exchange?: string,
    exchangeType: string = 'topic',
  ) {
    const targetExchange = exchange || this.defaultExchange;
    const channel = this.connectionService.getChannel();
    await channel.assertExchange(targetExchange, exchangeType, {
      durable: true,
    });
    channel.publish(
      targetExchange,
      routingKey,
      Buffer.from(JSON.stringify(message)),
      { persistent: true },
    );
  }
}
