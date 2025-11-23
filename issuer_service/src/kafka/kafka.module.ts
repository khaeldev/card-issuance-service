import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { KAFKA_SERVICE } from '../shared/constants';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: KAFKA_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId:
                configService.get<string>('app.kafka.clientId') ||
                'default-client-id',
              brokers: [
                configService.get<string>('app.kafka.broker') || 'kafka:9092',
              ],
              retry: {
                initialRetryTime: 300,
                retries: 10,
              },
            },
            consumer: {
              allowAutoTopicCreation: true,
              groupId:
                configService.get<string>('app.kafka.consumerGroupId') ||
                'issuer_consumer_group_id',
            },
            producer: {
              allowAutoTopicCreation: true,
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class KafkaModule {}
