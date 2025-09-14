# Multi-stage Dockerfile for Next.js app optimized for GCP Cloud Run
# Uses multi-stage builds to minimize final image size and improve security

# ================================
# Stage 1: Dependencies
# Purpose: Install production dependencies in a clean environment
# This stage is separate to leverage Docker layer caching
# ================================
FROM node:20-alpine AS deps
# Add libc6-compat for Alpine Linux compatibility with node-gyp and native modules
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files first to leverage Docker layer caching
# If package files haven't changed, this layer will be cached
COPY package.json package-lock.json ./
# Install only production dependencies and clean npm cache to reduce size
RUN npm ci --only=production && \
    npm cache clean --force

# ================================
# Stage 2: Builder
# Purpose: Build the Next.js application with all dependencies
# This stage includes dev dependencies needed for building
# ================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies)
# Dev dependencies are needed for the build process (TypeScript, build tools, etc.)
COPY package.json package-lock.json ./
RUN npm ci && \
    npm cache clean --force

# Copy all source code files
# This happens after dependency installation to leverage caching
COPY . .

# Build the Next.js application
# NEXT_TELEMETRY_DISABLED: Disables Next.js telemetry data collection
# NODE_ENV=production: Ensures production optimizations are applied
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ================================
# Stage 3: Runner (Production)
# Purpose: Minimal runtime environment with only necessary files
# This is the final image that will be deployed
# ================================
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user for security best practices
# Running as non-root prevents container privilege escalation
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set production environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# PORT: Cloud Run automatically sets this, but we provide a default
# HOSTNAME: Bind to all network interfaces (required for container environments)
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Copy only the necessary files from the builder stage
# public/: Static assets (images, fonts, etc.)
# .next/standalone/: Contains the minimal server and dependencies
# .next/static/: Contains static files generated during build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy production dependencies from the deps stage
# These are separate from the standalone bundle for better caching
COPY --from=deps /app/node_modules ./node_modules

# Change ownership of all files to the non-root user
# This ensures the application can read/write necessary files
RUN chown -R nextjs:nodejs /app

# Switch to non-root user for security
# All subsequent commands will run as this user
USER nextjs

# Expose port 8080 (Cloud Run's default port)
# This is documentation only - actual port binding is handled by Docker
EXPOSE 8080

# Start the Next.js standalone server
# server.js is created by Next.js when output: 'standalone' is configured
CMD ["node", "server.js"]