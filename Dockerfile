# ============================================
# VividPlate - Cloud Run Dockerfile
# ============================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install native build tools and vips for sharp
RUN apk add --no-cache libc6-compat python3 make g++ vips-dev

COPY package.json package-lock.json* ./
RUN npm ci
RUN npm install @rollup/rollup-linux-x64-musl --save-optional || true
# Install sharp with platform-specific prebuilt binaries for Alpine
RUN npm install --cpu=x64 --os=linux --libc=musl @img/sharp-linuxmusl-x64

# ---------- Stage 2: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage 3: Production ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for health checks and vips for sharp runtime
RUN apk add --no-cache curl vips

ENV NODE_ENV=production
ENV PORT=8080

# Copy node_modules (with sharp pre-built for Alpine)
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy compiled app
COPY --from=builder /app/dist ./dist

# Copy shared folder (required for schema)
COPY --from=builder /app/shared ./shared

# Create uploads directory
RUN mkdir -p /app/uploads

# Security: Run as non-root user
RUN addgroup -S nodejs && adduser -S vividplate -G nodejs
RUN chown -R vividplate:nodejs /app
USER vividplate

EXPOSE 8080

# Health check using curl (server exposes /health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Start the server (built output places server at dist/server/index.js)
CMD ["node", "dist/server/index.js"]
