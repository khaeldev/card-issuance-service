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
    // KafkaJS entrega el mensaje con metadata, el payload útil suele estar en message o message.value dependiendo de la config de serialización.
    // NestJS simplifica esto, asumiendo que el message es el value JSON parseado.
    await this.service.processIssuance(message);
  }
}
