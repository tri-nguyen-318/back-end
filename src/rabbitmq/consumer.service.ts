// src/rabbitmq/consumer.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConnectionService } from './connection.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConsumerService.name);
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

  async onModuleInit() {
    // Initialize default consumers here if needed
  }

  async consumeQueue(
    callback: (msg: any) => Promise<void>,
    queue?: string,
    options: { durable?: boolean } = { durable: true },
  ) {
    const targetQueue = queue || this.defaultQueue;
    const channel = this.connectionService.getChannel();
    await channel.assertQueue(targetQueue, options);

    channel.consume(targetQueue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          channel.ack(msg);
        } catch (error) {
          this.logger.error(
            `Error processing message from ${targetQueue}`,
            error,
          );
          channel.nack(msg, false, false);
        }
      }
    });
  }

  async consumeExchange(
    routingKey: string,
    callback: (msg: any) => Promise<void>,
    queue?: string,
    exchange?: string,
    exchangeType: string = 'topic',
    options: { durable?: boolean } = { durable: true },
  ) {
    const targetExchange = exchange || this.defaultExchange;
    const targetQueue = queue || `${this.defaultQueue}_${routingKey}`;

    const channel = this.connectionService.getChannel();
    await channel.assertExchange(targetExchange, exchangeType, options);
    await channel.assertQueue(targetQueue, options);
    await channel.bindQueue(targetQueue, targetExchange, routingKey);

    this.consumeQueue(callback, targetQueue, options);
  }
}
