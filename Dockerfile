# ============================================
# VividPlate - Cloud Run Dockerfile
# ============================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-slim AS deps
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ libvips-dev \
  && rm -rf /var/lib/apt/lists/*

# Only copy package.json (NOT lockfile) so npm resolves platform-specific
# optional deps (sharp, esbuild) fresh for linux/glibc
COPY package.json ./

RUN npm install

# ---------- Stage 2: Build ----------
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ libvips-dev \
  && rm -rf /var/lib/apt/lists/*

# Only copy package.json (NOT lockfile) so npm resolves platform-specific
# optional deps fresh for linux/glibc
COPY package.json ./

RUN npm install

COPY . .

RUN npm run build
RUN npx vite build
RUN mv dist/public dist/server/public

# ---------- Stage 3: Production ----------
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl libvips \
  && rm -rf /var/lib/apt/lists/*

# Create non-root user before copying files
RUN addgroup --system nodejs && adduser --system --ingroup nodejs vividplate

ENV NODE_ENV=production
ENV PORT=8080

# Copy files with correct ownership from the start (no chown -R needed)
COPY --from=deps --chown=vividplate:nodejs /app/node_modules ./node_modules
COPY --chown=vividplate:nodejs package.json ./
COPY --from=builder --chown=vividplate:nodejs /app/dist ./dist
COPY --from=builder --chown=vividplate:nodejs /app/shared ./shared

RUN mkdir -p /app/uploads && chown vividplate:nodejs /app/uploads

USER vividplate

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["node", "dist/server/index.js"]
