# ============================================
# VividPlate - Cloud Run Dockerfile
# ============================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++ vips-dev

COPY package.json package-lock.json* ./

# Use npm install (not ci) to avoid lockfile sync issues with optional platform deps
RUN npm install --ignore-scripts

# Install prebuilt musl/Alpine binary for sharp, rollup, and esbuild
RUN npm install --cpu=x64 --os=linux --libc=musl @img/sharp-linuxmusl-x64 --no-save 2>/dev/null || true
RUN npm install @rollup/rollup-linux-x64-musl --save-optional --no-save 2>/dev/null || true
RUN npm install @esbuild/linux-x64 --no-save 2>/dev/null || true

# ---------- Stage 2: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++ vips-dev

COPY package.json package-lock.json* ./

# Use npm install (not ci) to properly resolve optional platform-specific deps
# This avoids the npm bug with rollup/esbuild musl binaries on Alpine
RUN npm install --ignore-scripts 2>/dev/null || npm install --ignore-scripts --legacy-peer-deps

# Explicitly install the Linux x64 musl binaries for rollup, esbuild, and sharp
RUN npm install @rollup/rollup-linux-x64-musl --no-save 2>/dev/null || true
RUN npm install @esbuild/linux-x64 --no-save 2>/dev/null || true
RUN npm install --cpu=x64 --os=linux --libc=musl @img/sharp-linuxmusl-x64 --no-save 2>/dev/null || true

COPY . .

RUN npm run build
RUN npx vite build
RUN mv dist/public dist/server/public


# ---------- Stage 3: Production ----------
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl vips

# Create non-root user before copying files
RUN addgroup -S nodejs && adduser -S vividplate -G nodejs

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
