FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run typecheck && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup -S -g 1001 kenmatch && adduser -S -D -H -u 1001 -G kenmatch kenmatch \
  && mkdir -p /app/data /tmp \
  && chown -R kenmatch:kenmatch /app /tmp

COPY --from=builder --chown=kenmatch:kenmatch /app/.next/standalone ./
COPY --from=builder --chown=kenmatch:kenmatch /app/.next/static ./.next/static
COPY --from=builder --chown=kenmatch:kenmatch /app/public ./public

EXPOSE 3000
USER kenmatch
CMD ["node", "server.js"]
