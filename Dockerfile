# Production Dockerfile for Nexus AI Studio
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build frontend and server bundles
RUN npm run build

# ----------------------------------------------------
# Production runner image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests and install production-only packages
COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy compiled assets from builder
COPY --from=builder /app/dist ./dist

# Ensure runtime data directory exists
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
