// src/config/rabbitmq.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('rabbitmq', () => ({
  host: process.env.RABBITMQ_HOST || 'localhost',
  port: parseInt(process.env.RABBITMQ_PORT || '', 10) || 5672,
  user: process.env.RABBITMQ_USER || 'admin',
  password: process.env.RABBITMQ_PASSWORD || 'password',
  vhost: process.env.RABBITMQ_VHOST || '/',
  queue: process.env.RABBITMQ_QUEUE || 'default_queue',
  exchange: process.env.RABBITMQ_EXCHANGE || 'default_exchange',
  reconnectTimeout:
    parseInt(process.env.RABBITMQ_RECONNECT_TIMEOUT || '', 10) || 5000,
}));
