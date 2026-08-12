# ── Étape 1 : compilation TypeScript ──────────────────────────────────────────
FROM node:22-bookworm-slim AS builder
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY src/ ./src/
RUN npm run build

# ── Étape 2 : image finale ─────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY prisma/ ./prisma/
# Installe les dépendances de production (prisma inclus pour db push au démarrage)
RUN npm ci --omit=dev && npx prisma generate
COPY --from=builder /app/dist ./dist
# db push synchronise le schéma Prisma avec PostgreSQL avant de démarrer l'API
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
