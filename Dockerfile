# ============================================
# VividPlate - Cloud Run Dockerfile
# ============================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Install native build tools
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci

# ---------- Stage 2: Build ----------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---------- Stage 3: Production ----------
FROM node:20-alpine AS runner
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

ENV NODE_ENV=production
ENV PORT=8080

# Copy node_modules and package.json
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

# Health check using curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
=======
# Health check using curl
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# Start the server
CMD ["node", "dist/index.js"]
