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

ENV NODE_ENV=production
ENV PORT=8080

# Copy node_modules and package.json
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy compiled app (Matches "dist/server/index.js")
COPY --from=builder /app/dist ./dist

# Uncomment the line below ONLY if you have a folder named 'shared' in your root
# COPY --from=builder /app/shared ./shared

# Create uploads directory with permissions
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Security: Run as non-root user
RUN addgroup -S nodejs && adduser -S vividplate -G nodejs
RUN chown -R vividplate:nodejs /app
USER vividplate

EXPOSE 8080

# Health check (matches default Express port)
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the server (matches the "start" script in your package.json)
CMD ["node", "dist/server/index.js"]