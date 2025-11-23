import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CardRequest } from './entities/card-request.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { IssuerController } from './controllers/issuer.controller';
import { IssuerService } from './services/issuer.service';

@Module({
  imports: [TypeOrmModule.forFeature([CardRequest]), KafkaModule],
  controllers: [IssuerController],
  providers: [IssuerService],
  exports: [IssuerService],
})
export class IssuerModule {}
