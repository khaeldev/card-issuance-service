# ============================================
# Etapa 1: Base
# ============================================
FROM node:22.20.0-alpine3.22 AS base
RUN apk add --no-cache libc6-compat

# ============================================
# Etapa 2: Dependencias de Producción SOLAMENTE
# ============================================
FROM base AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
# Con npm, usamos 'npm ci' para una instalación limpia a partir del lockfile.
RUN --mount=type=cache,id=npm-prod,target=/root/.npm \
    npm ci --omit=dev

# ============================================
# Etapa 3: Todas las Dependencias (para la compilación)
# ============================================
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm-dev,target=/root/.npm \
    npm ci

# ============================================
# Etapa 4: Constructor (Builder)
# ============================================
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ============================================
# Etapa 5: Ejecutor (Runner)
# ============================================
FROM node:22.20.0-alpine3.22 AS runner

RUN apk add --no-cache wget dumb-init && \
    rm -rf /var/cache/apk/*

ENV NODE_ENV=production
WORKDIR /usr/src/app


COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./

# Verificación
RUN echo "=== Verificación final ===" && \
    du -sh node_modules && \
    find node_modules -type f | wc -l && \
    (ls node_modules/ | grep -E 'typescript|jest|eslint|prettier' && echo "⚠️ DevDeps encontradas" || echo "✅ Limpio")

RUN addgroup -S appgroup && \
    adduser -S appuser -G appgroup && \
    chown -R appuser:appgroup /usr/src/app

USER appuser

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/main"]