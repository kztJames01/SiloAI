FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package-lock.json ./
COPY package.json ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
RUN npm ci --workspace=backend --workspace=shared --ignore-scripts

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY shared/ ./shared/
COPY backend/ ./backend/
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=builder /app/backend/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/backend/prisma ./prisma

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 silo
USER silo

EXPOSE 3000

CMD ["node", "dist/backend/src/index.js"]
