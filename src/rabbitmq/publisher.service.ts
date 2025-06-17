// src/rabbitmq/publisher.service.ts
import { Injectable } from '@nestjs/common';
import { ConnectionService } from './connection.service';

@Injectable()
export class PublisherService {
  constructor(private readonly connectionService: ConnectionService) {}

  async publishToQueue(queue: string, message: any) {
    const channel = this.connectionService.getChannel();
    await channel.assertQueue(queue, { durable: true });
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }

  async publishToExchange(
    exchange: string,
    routingKey: string,
    message: any,
    exchangeType: string = 'topic',
  ) {
    const channel = this.connectionService.getChannel();
    await channel.assertExchange(exchange, exchangeType, { durable: true });
    channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));
  }
}
