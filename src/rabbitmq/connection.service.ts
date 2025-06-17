// src/rabbitmq/connection.service.ts
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class ConnectionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionService.name);
  private connection: amqp.Connection;
  private channel: amqp.Channel;
  private readonly config: {
    host: string;
    port: number;
    user: string;
    password: string;
    vhost: string;
    reconnectTimeout: number;
  };

  constructor(private readonly configService: ConfigService) {
    const config = this.configService.get('rabbitmq');

    if (!config) {
      throw new Error('RabbitMQ configuration not found');
    }

    this.config = config;
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.closeConnection();
  }

  private getConnectionUrl(): string {
    const { host, port, user, password, vhost } = this.config;
    return `amqp://${user}:${password}@${host}:${port}/${vhost}`;
  }

  private async connect() {
    try {
      const url = this.getConnectionUrl();
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();

      this.connection.on('close', () => {
        this.logger.warn(
          'RabbitMQ connection closed. Attempting to reconnect...',
        );
        setTimeout(() => this.connect(), this.config.reconnectTimeout);
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
      });

      this.logger.log('Successfully connected to RabbitMQ');
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      setTimeout(() => this.connect(), this.config.reconnectTimeout);
    }
  }

  private async closeConnection() {
    try {
      if (this.channel) await this.channel.close();
      if (this.connection) await this.connection.close();
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  public getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }
    return this.channel;
  }
}
