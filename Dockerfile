# syntax=docker/dockerfile:1
# Build Next.js (standalone) cho Ocean Park — multi-stage, chạy prisma generate.
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

# --- deps: cài node_modules từ lockfile ---
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# --- builder: generate Prisma Client + next build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm exec prisma generate
RUN pnpm build

# --- runner: image gọn chạy standalone ---
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Prisma Client + engine + schema để chạy migrate deploy lúc khởi động nếu cần.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
