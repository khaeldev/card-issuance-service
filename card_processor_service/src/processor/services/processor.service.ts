import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { CardRequest, CardStatus } from './../entities/card-request.entity';
import {
  KAFKA_SERVICE,
  TOPIC_CARD_ISSUED,
  TOPIC_CARD_DLQ,
} from './../../shared/constants';
import { CardRequestedEventDto } from '../dto/card-event.dto';

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);
  // Tiempos de espera requeridos: 1s, 2s, 4s
  private readonly RETRY_DELAYS = [1000, 2000, 4000];

  constructor(
    @InjectRepository(CardRequest) private cardRepo: Repository<CardRequest>,
    @Inject(KAFKA_SERVICE) private kafkaClient: ClientKafka,
  ) {}

  async processIssuance(payload: CardRequestedEventDto) {
    const { requestId, product } = payload;
    this.logger.log(`Procesando solicitud: ${requestId}`);

    let attempts = 0;
    let success = false;

    // Loop de reintento manual
    while (attempts <= 3) {
      try {
        // Simular carga externa (200-500ms) y posible error
        await this.simulateExternalProvider(product.simulateError, attempts);

        const cardData = this.generateCardData();

        await this.cardRepo.update(requestId, {
          status: CardStatus.ISSUED,
          cardNumber: cardData.number,
          cvv: cardData.cvv,
          expirationDate: cardData.expiration,
        });

        this.kafkaClient.emit(TOPIC_CARD_ISSUED, {
          key: payload.customer.documentNumber,
          value: { requestId, status: 'ISSUED', card: { ...cardData } },
        });

        this.logger.log(`Tarjeta emitida exitosamente para ${requestId}`);
        success = true;
        break;
      } catch (error) {
        attempts++;
        this.logger.error(
          `Intento ${attempts} fallido para ${requestId}: ${error.message}`,
        );

        if (attempts > 3) {
          break; // Agotamos reintentos
        }

        // Esperar antes del siguiente reintento (Backoff: 1s, 2s, 4s)
        const delay = this.RETRY_DELAYS[attempts - 1];
        this.logger.warn(`Esperando ${delay}ms antes de reintentar...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // Si falló tras 3 intentos (+ el inicial), enviar a DLQ
    if (!success) {
      await this.handleFailure(payload, attempts);
    }
  }

  private async handleFailure(
    payload: CardRequestedEventDto,
    attempts: number,
  ) {
    const { requestId } = payload;
    this.logger.error(
      `Solicitud ${requestId} enviada a DLQ tras ${attempts} intentos.`,
    );

    // Actualizar DB a FAILED
    await this.cardRepo.update(requestId, { status: CardStatus.FAILED });

    // Publicar en DLQ
    this.kafkaClient.emit(TOPIC_CARD_DLQ, {
      key: payload.customer.documentNumber,
      value: {
        originalPayload: payload,
        reason: 'Max retries exceeded from external provider',
        attempts,
      },
    });
  }

  private async simulateExternalProvider(
    forceError: boolean,
    currentAttempt: number,
  ) {
    this.logger.log(
      `Simulando proveedor externo (Intento ${currentAttempt + 1})...`,
    );
    // Latencia aleatoria 200 - 500ms
    const latency = Math.floor(Math.random() * (500 - 200 + 1) + 200);
    this.logger.log(`Latencia simulada: ${latency}ms`);
    await new Promise((r) => setTimeout(r, latency));

    // Lógica aleatoria de fallo (o forzada por flag)
    // Si forceError es true, fallará siempre (útil para probar reintentos)

    // Si no, falla aleatoriamente 50% de las veces
    const shouldFail = forceError || Math.random() < 0.5;

    if (shouldFail) {
      throw new Error('External Provider Timeout/Error');
    }
  }

  private generateCardData() {
    return {
      number:
        '4000' +
        Math.floor(Math.random() * 100000000000)
          .toString()
          .padStart(12, '0'),
      cvv: Math.floor(Math.random() * (999 - 100 + 1) + 100).toString(),
      expiration: '12/29',
    };
  }
}
