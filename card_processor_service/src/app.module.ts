import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { KafkaModule } from './kafka/kafka.module';
import { DatabaseModule } from './database/database.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ProcessorModule,
    DatabaseModule,
    KafkaModule,
  ],
  controllers: [],
  providers: [Logger],
})
export class AppModule {}
