# VividPlate - Digital Restaurant Menu Platform
# Dockerfile for Google Cloud Run Deployment

# Build arguments
ARG NODE_VERSION=20

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev for build)
RUN npm ci

# ============================================
# Stage 2: Build
# ============================================
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build the application (frontend + backend)
RUN npm run build

# ============================================
# Stage 3: Production
# ============================================
FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy necessary files for runtime
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 vividplate && \
    chown -R vividplate:nodejs /app

USER vividplate

# Expose the port Cloud Run expects
EXPOSE 8080

# Health check with extended start period for database connection
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the application
CMD ["node", "dist/index.js"]
