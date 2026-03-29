# =============================================================================
#  CineTrack — Multi-stage Dockerfile
#  Optimised for minimal final image size and layer caching.
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1 — deps
#   Install only production dependencies so the next stage can copy them.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app

# Install libc compat for native binaries (bcryptjs, Prisma engine)
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# ---------------------------------------------------------------------------
# Stage 2 — builder
#   Full install (dev deps included) so we can run `next build`.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY . .

# Generate Prisma client before building
RUN npx prisma generate

ARG NEXT_TELEMETRY_DISABLED=1
ENV NEXT_TELEMETRY_DISABLED=$NEXT_TELEMETRY_DISABLED

# Provide placeholder env so Next.js build doesn't fail on missing vars.
# Real values are injected at container runtime via environment variables.
ENV DATABASE_URL="postgresql://placeholder:placeholder@placeholder:5432/placeholder"
ENV AUTH_SECRET="build-time-placeholder"
ENV TVDB_API_KEY="build-time-placeholder"

RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3 — runner (final image)
#   Only the compiled output + production node_modules.
#   No source code, no dev tools, no secrets.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + generated client (needed for migrate deploy at startup)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Entrypoint: run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
