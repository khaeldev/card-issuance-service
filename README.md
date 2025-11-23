# 💳 Sistema de Emisión de Tarjetas (Event-Driven Architecture)

Solución técnica para el proceso de emisión de tarjetas financieras de alta disponibilidad. Este proyecto implementa una arquitectura de microservicios asíncronos orquestados mediante **NestJS** y **Apache Kafka**, garantizando la regla de negocio de "una tarjeta por cliente" y manejando fallos mediante estrategias de **Retry & Dead Letter Queue (DLQ)**.

---

## 🚀 Características Principales

- **Arquitectura Basada en Eventos (EDA):** Desacoplamiento total entre la recepción de la solicitud (`Issuer API`) y el procesamiento (`Card Processor`).
- **Resiliencia & Tolerancia a Fallos:** Implementación de patrón de reintentos con **Backoff Exponencial** (1s, 2s, 4s).
- **Manejo de Errores (DLQ):** Los mensajes que exceden el límite de reintentos son desviados a un tópico de "Dead Letter Queue" para análisis posterior, sin bloquear el flujo principal.
- **Integridad de Datos:** Garantía de unicidad (Idempotencia) a nivel de base de datos para evitar duplicidad de tarjetas por cliente.
- **Testing Avanzado:** Tests de Integración reales utilizando **Testcontainers** (PostgreSQL en Docker efímero) para validar flujos completos.
- **Documentación API:** OpenAPI (Swagger) autogenerado.

---

## 🛠 Tech Stack

- **Runtime:** Node.js v20 (LTS)
- **Framework:** NestJS (Modo Monorepo)
- **Lenguaje:** TypeScript
- **Message Broker:** Apache Kafka (vía KafkaJS)
- **Base de Datos:** PostgreSQL 15
- **ORM:** TypeORM
- **Validación:** `class-validator` & `class-transformer`
- **Infraestructura:** Docker & Docker Compose
- **Testing:** Jest, Supertest, Testcontainers

---

## 📂 Estructura del Proyecto (Monorepo)

```bash
├── card_processor_service  # Microservice [Consumer] Worker. Simula emisión, latencia y reintentos.
├── issuer_service          # Microservice [Producer] API HTTP. Recibe solicitudes y valida reglas síncronas.
├── docker                  # Orquestación de Microservicios, Kafka, Zookeeper y Postgres.
├── swagger.yml             # Documentacion General API 
└── package.json

## 🚀 Setup (Local Development)

Follow these steps to spin up the entire environment:

## 1. Clonar el repositorio (reemplazar URL_DEL_REPOSITORIO)
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_REPOSITORIO>

## 2. Configurar varaibles de entorno
    MANUALLY: Copy/create the necessary .env files from .env.example files:
    - card_processor_service/.env
    - issuer_service/.env
    - docker/.env
    Adjust settings inside these files if needed (ports, credentials, Kafka topics, etc.).

## 4. Ejecutar los servicios 
docker compose -f docker/docker-compose.yml up

## 5. Construir imagenes forzar no cache
```bash
docker compose -f docker/docker-compose.yml build --no-cache
```

## 6. Wait for Auto-setup Postgres

## 7. Check status

docker ps

## 8. Ir a swagger y probar directamente

swagger.yml

## 9.- Scripts pra crear topics manual (No es necesario ya que se configuro para que se creen de forma automatica)

afka-topics --create --if-not-exists --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1 --topic io.card.requested.v1

kafka-topics --create --if-not-exists --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1 --topic io.cards.issued.v1

kafka-topics --create --if-not-exists --bootstrap-server kafka:9092 --partitions 1 --replication-factor 1 --topic io.card.requested.v1.dlq
