# Dockerfile for NestJS Threat Intel Backend
FROM node:20-slim AS builder

WORKDIR /app

# Copy package manifests and install dependencies
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code and build
COPY tsconfig*.json nest-cli.json ./
COPY src ./src/

# Generate Prisma Client & build JS assets
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-slim AS runner

WORKDIR /app

# Install netcat-openbsd/openssl for readiness checks and Prisma runtime
RUN apt-get update && apt-get install -y netcat-openbsd openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Create entrypoint script with clean LF line endings
RUN printf '#!/bin/sh\n\
echo "Waiting for PostgreSQL database at ${POSTGRES_HOST}:${POSTGRES_PORT}..."\n\
while ! nc -z ${POSTGRES_HOST} ${POSTGRES_PORT}; do sleep 1; done;\n\
echo "PostgreSQL is ready! Executing Prisma database migrations..."\n\
npx prisma migrate deploy || npx prisma db push\n\
echo "Seeding Admin user and default Threat Feeds..."\n\
node dist/prisma/seed.js || npx ts-node prisma/seed.ts || true\n\
echo "Starting NestJS Production Server..."\n\
exec node dist/src/main.js\n' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

ENTRYPOINT ["/app/entrypoint.sh"]
