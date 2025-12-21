# ============================================
# VividPlate - Cloud Run Dockerfile (FIXED)
# ============================================

# ---------- Stage 1: Dependencies ----------
FROM node:20-alpine AS deps

WORKDIR /app

# Native build tools (for bcrypt, sharp, etc.)
RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./
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

# Copy production dependencies ONLY
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Copy compiled app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/shared ./shared

# Uploads directory
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Non-root user
RUN addgroup -S nodejs && adduser -S vividplate -G nodejs
RUN chown -R vividplate:nodejs /app

USER vividplate

EXPOSE 8080

# ✅ Correct health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
