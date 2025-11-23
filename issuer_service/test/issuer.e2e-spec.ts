import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { ClientKafka } from '@nestjs/microservices';
import { Repository } from 'typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { CardRequest } from './../src/issuer/entities/card-request.entity';
import { IssuerController } from './../src/issuer/controllers/issuer.controller';
import { IssuerService } from '../src/issuer/services/issuer.service';
import { KAFKA_SERVICE } from './../src/shared/constants';

describe('Issuer API (Integration with Postgres)', () => {
  jest.setTimeout(60000); // Aumentar timeout porque levantar Docker toma unos segundos

  let app: INestApplication;
  let cardRepo: Repository<CardRequest>;
  let kafkaClientMock: MockProxy<ClientKafka>;
  let container: StartedPostgreSqlContainer; // Referencia al contenedor

  beforeAll(async () => {
    // 1. Levantar contenedor de Postgres Real
    container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('cards_db')
      .withUsername('user')
      .withPassword('password')
      .start();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    kafkaClientMock = mock<ClientKafka>();
    kafkaClientMock.emit.mockReturnThis();

    const moduleFixture: TestingModule = await Test.createTestingModule({
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
      controllers: [IssuerController],
      providers: [
        IssuerService,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { provide: KAFKA_SERVICE, useValue: kafkaClientMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    cardRepo = moduleFixture.get<Repository<CardRequest>>(
      getRepositoryToken(CardRequest),
    );
  });

  afterEach(async () => {
    // 3. Limpiar tablas entre tests para aislamiento total
    await cardRepo.query(`TRUNCATE TABLE "cards_db" RESTART IDENTITY`);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
    await container.stop(); // Apagar el contenedor
  });

  it('/cards/issuer (POST) - Debe guardar en Postgres y Validar Unique Constraint', async () => {
    // ARRANGE
    // A. Insertar primer registro
    const payload = {
      customer: {
        documentType: 'DNI',
        documentNumber: '12345678',
        fullName: 'Primer Usuario',
        age: 30,
        email: 'one@test.com',
      },
      product: { type: 'VISA', currency: 'PEN', simulateError: false },
    };

    // ACT % ASSERT
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/cards/issuer')
      .send(payload)
      .expect(201);

    // B. Intentar insertar el mismo DNI (Debe fallar con 409 REAL de la DB)
    // Aquí probamos que el error code '23505' de Postgres real dispara la excepción correcta
    const duplicatePayload = {
      ...payload,
      customer: { ...payload.customer, fullName: 'Intruso' },
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await request(app.getHttpServer())
      .post('/cards/issuer')
      .send(duplicatePayload)
      .expect(409);
    // Verificar que solo hay 1 registro en la DB real
    const count = await cardRepo.count();
    expect(count).toBe(1);
  });
});
