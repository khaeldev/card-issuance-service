/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Repository } from 'typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { ClientKafka } from '@nestjs/microservices';
import { ProcessorService } from './../src/processor/services/processor.service';
import {
  CardRequest,
  CardStatus,
} from './../src/processor/entities/card-request.entity';
import { KAFKA_SERVICE, TOPIC_CARD_DLQ } from './../src/shared/constants';
import { CardRequestedEventDto } from '../src/processor/dto/card-event.dto';

describe('Card Processor Integration (Postgres)', () => {
  jest.setTimeout(60000);

  let service: ProcessorService;
  let cardRepo: Repository<CardRequest>;
  let kafkaClientMock: MockProxy<ClientKafka>;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('cards_db')
      .withUsername('user')
      .withPassword('password')
      .start();

    kafkaClientMock = mock<ClientKafka>();
    kafkaClientMock.emit.mockReturnThis();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // 2. Configurar TypeORM con los datos del contenedor dinámico
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: container.getHost(),
          port: container.getPort(),
          username: container.getUsername(),
          password: container.getPassword(),
          database: container.getDatabase(),
          entities: [CardRequest],
          synchronize: true,
        }),
        TypeOrmModule.forFeature([CardRequest]),
      ],
      providers: [
        ProcessorService,
        { provide: KAFKA_SERVICE, useValue: kafkaClientMock },
      ],
    }).compile();

    service = module.get<ProcessorService>(ProcessorService);
    cardRepo = module.get<Repository<CardRequest>>(
      getRepositoryToken(CardRequest),
    );
  });

  afterEach(async () => {
    await cardRepo.query(`TRUNCATE TABLE "cards_db" RESTART IDENTITY`);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await container.stop();
  });

  it('debe persistir el estado FAILED en Postgres tras agotar reintentos', async () => {
    // ARRANGE

    const requestId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    await cardRepo.save({
      id: requestId,
      documentType: 'DNI',
      documentNumber: '88888888',
      fullName: 'Retry Tester',
      status: CardStatus.PENDING,
    });

    const payload = {
      requestId,
      customer: { documentNumber: '88888888' },
      product: { simulateError: true },
    };

    const sleepSpy = jest
      .spyOn(service as any, 'sleep')
      .mockResolvedValue(undefined);

    // ACT
    await service.processIssuance(payload as CardRequestedEventDto);

    const failedRequest = await cardRepo.findOneBy({ id: requestId });

    // ASSERT
    expect(failedRequest!.status).toBe(CardStatus.FAILED);

    expect(kafkaClientMock.emit).toHaveBeenCalledWith(
      TOPIC_CARD_DLQ,
      expect.objectContaining({
        value: expect.objectContaining({ attempts: expect.any(Number) }),
      }),
    );

    expect(sleepSpy).toHaveBeenCalled();

    expect(sleepSpy.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
