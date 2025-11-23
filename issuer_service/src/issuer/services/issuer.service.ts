import {
  Inject,
  Injectable,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { CardRequest, CardStatus } from './../entities/card-request.entity';
import { IssueCardDto } from './../dto/issuer-card.dto';
import { KAFKA_SERVICE, TOPIC_CARD_REQUESTED } from './../../shared/constants';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class IssuerService {
  private readonly logger = new Logger(IssuerService.name);

  constructor(
    @InjectRepository(CardRequest) private cardRepo: Repository<CardRequest>,
    @Inject(KAFKA_SERVICE) private kafkaClient: ClientKafka,
  ) {}

  async createRequest(dto: IssueCardDto) {
    const requestId = uuidv4() as string;

    // 1. Persistir en DB con estado PENDING
    const newRequest = this.cardRepo.create({
      id: requestId,
      documentType: dto.customer.documentType,
      documentNumber: dto.customer.documentNumber,
      fullName: dto.customer.fullName,
      status: CardStatus.PENDING,
    }) as CardRequest;

    try {
      this.logger.log(
        `Guardando nueva solicitud de tarjeta: ${requestId} para cliente ${dto.customer.documentNumber}`,
      );
      await this.cardRepo.save(newRequest);
    } catch (error) {
      // Manejo de error de unicidad (Postgres error 23505)
      if (error.code === '23505') {
        throw new ConflictException(
          'El cliente ya tiene una solicitud o tarjeta en proceso.',
        );
      }
      throw new InternalServerErrorException('Error guardando solicitud');
    }

    // 2. Publicar evento en Kafka
    const payload = {
      requestId,
      ...dto,
      metadata: { timestamp: new Date().toISOString() },
    };

    // Usamos el documentNumber como Key para mantener el orden y particionado
    this.kafkaClient.emit(TOPIC_CARD_REQUESTED, {
      key: dto.customer.documentNumber,
      value: payload,
    });

    this.logger.log(`Evento publicado: ${requestId}`);

    return { requestId, status: CardStatus.PENDING };
  }
}
