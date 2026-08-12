# ── Étape 1 : compilation TypeScript ──────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY prisma/ ./prisma/
RUN npx prisma generate
COPY src/ ./src/
RUN npm run build

# ── Étape 2 : image finale ─────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
COPY prisma/ ./prisma/
# Installe les dépendances de production (prisma inclus pour db push au démarrage)
RUN npm ci --omit=dev && npx prisma generate
COPY --from=builder /app/dist ./dist
# db push synchronise le schéma Prisma avec PostgreSQL avant de démarrer l'API
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
