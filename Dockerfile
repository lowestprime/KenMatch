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
LABEL org.opencontainers.image.source="https://github.com/lowestprime/KenMatch"
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
HEALTHCHECK --interval=30s --timeout=5s --retries=5 --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"
USER kenmatch
CMD ["node", "server.js"]
