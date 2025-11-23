import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CardRequest } from './../processor/entities/card-request.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('app.database.url'),
        entities: [CardRequest],
        synchronize: true, // Set to false in production
        logging: process.env.NODE_ENV === 'development',
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
