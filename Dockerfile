# Multi-stage build for Karaoke For Jellyfin
FROM node:20-alpine AS base

# Install ALL dependencies (needed for build)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Install only production dependencies (for the final image)
FROM base AS prod-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Next.js standalone output (traced minimal deps)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Custom server
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./

# Production-only node_modules (socket.io, jellyfin sdk, etc. — no dev deps)
COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules

RUN mkdir -p /app/lyrics /app/media
RUN chown nextjs:nodejs /app/lyrics /app/media

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
