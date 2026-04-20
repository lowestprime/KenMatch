FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run typecheck && npm run build

FROM node:22-alpine AS runner
LABEL org.opencontainers.image.source="https://github.com/lowestprime/KenMatch"
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV TMPDIR=/tmp

RUN addgroup -S -g 1001 kenmatch && adduser -S -D -H -u 1001 -G kenmatch kenmatch \
  && mkdir -p /app/data /tmp /app/node_modules \
  && chown -R kenmatch:kenmatch /app /tmp

COPY --from=builder --chown=kenmatch:kenmatch /app/.next/standalone ./
COPY --from=builder --chown=kenmatch:kenmatch /app/.next/static ./.next/static
COPY --from=builder --chown=kenmatch:kenmatch /app/public ./public
COPY --from=builder --chown=kenmatch:kenmatch /app/node_modules/libsql ./node_modules/libsql
COPY --from=builder --chown=kenmatch:kenmatch /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=builder --chown=kenmatch:kenmatch /app/node_modules/@neon-rs ./node_modules/@neon-rs

COPY --from=builder --chown=kenmatch:kenmatch /app/node_modules/libsql ./node_modules/libsql
COPY --from=builder --chown=kenmatch:kenmatch /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=builder --chown=kenmatch:kenmatch /app/node_modules/@neon-rs ./node_modules/@neon-rs

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)throw r.status}).catch(()=>process.exit(1))"
USER kenmatch
CMD ["node", "server.js"]
