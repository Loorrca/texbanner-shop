# syntax=docker/dockerfile:1
# Multi-arch image (built for linux/arm64 in CI, see .github/workflows/deploy.yml).

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Installs the sharp binaries for the image's own architecture (arm64 on a Raspberry Pi).
RUN npm ci

# Used by "docker compose up" on a development machine (migrations + seed)
FROM deps AS tools
COPY . .

FROM deps AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build && npm run build:scripts

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    UPLOAD_DIR=/app/storage/uploads MEDIA_DIR=/app/storage/media TZ=Africa/Tunis
RUN apk add --no-cache tzdata wget && addgroup -S app && adduser -S app -G app \
    && mkdir -p /app/storage/uploads /app/storage/media && chown -R app:app /app/storage
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static
COPY --from=builder --chown=app:app /app/public ./public
# Database migrations + catalog seed, bundled to plain JS so no dev dependency is needed at runtime
COPY --from=builder --chown=app:app /app/dist ./dist
COPY --from=builder --chown=app:app /app/drizzle ./drizzle
COPY --chown=app:app docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/api/health || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
