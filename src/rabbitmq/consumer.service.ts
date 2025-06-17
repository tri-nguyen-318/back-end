// src/rabbitmq/consumer.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConnectionService } from './connection.service';

@Injectable()
export class ConsumerService implements OnModuleInit {
  private readonly logger = new Logger(ConsumerService.name);

  constructor(private readonly connectionService: ConnectionService) {}

  async onModuleInit() {
    // Initialize consumers here
  }

  async consumeQueue(
    queue: string,
    callback: (msg: any) => Promise<void>,
    options: { durable?: boolean } = { durable: true },
  ) {
    const channel = this.connectionService.getChannel();
    await channel.assertQueue(queue, options);

    channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing message from ${queue}`, error);
          channel.nack(msg, false, false); // Don't requeue
        }
      }
    });
  }

  async consumeExchange(
    exchange: string,
    routingKey: string,
    queue: string,
    callback: (msg: any) => Promise<void>,
    exchangeType: string = 'topic',
    options: { durable?: boolean } = { durable: true },
  ) {
    const channel = this.connectionService.getChannel();
    await channel.assertExchange(exchange, exchangeType, options);
    await channel.assertQueue(queue, options);
    await channel.bindQueue(queue, exchange, routingKey);

    this.consumeQueue(queue, callback, options);
  }
}
