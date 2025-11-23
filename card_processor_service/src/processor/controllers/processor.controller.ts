import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ProcessorService } from './../services/processor.service';
import { TOPIC_CARD_REQUESTED } from './../../shared/constants';
import { CardRequestedEventDto } from '../dto/card-event.dto';

@Controller()
export class ProcessorController {
  constructor(private readonly service: ProcessorService) {}

  @EventPattern(TOPIC_CARD_REQUESTED)
  async handleCardRequest(@Payload() message: CardRequestedEventDto) {
    await this.service.processIssuance(message);
  }
}
