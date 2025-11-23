import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardRequest } from './entities/card-request.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { ProcessorController } from './controllers/processor.controller';
import { ProcessorService } from './services/processor.service';

@Module({
  imports: [TypeOrmModule.forFeature([CardRequest]), KafkaModule],
  controllers: [ProcessorController],
  providers: [ProcessorService],
  exports: [ProcessorService],
})
export class ProcessorModule {}
