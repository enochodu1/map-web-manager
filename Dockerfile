# Build stage for client
FROM node:18-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client .
RUN npm run build

# Build stage for server
FROM node:18-alpine AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app

# Copy built client
COPY --from=client-builder /app/client/.next /app/client/.next
COPY --from=client-builder /app/client/public /app/client/public
COPY --from=client-builder /app/client/package*.json /app/client/
COPY --from=client-builder /app/client/next.config.js /app/client/

# Copy built server
COPY --from=server-builder /app/server/dist /app/server/dist
COPY --from=server-builder /app/server/package*.json /app/server/

# Install production dependencies for both client and server
WORKDIR /app/client
RUN npm ci --only=production

WORKDIR /app/server
RUN npm ci --only=production

# Create data directory
RUN mkdir -p /app/data && mkdir -p /app/logs

# Copy start script
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Set working directory
WORKDIR /app

# Environment variables with defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_URL=http://localhost:3001
ENV DB_PATH=/app/data/database.sqlite

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start the application
ENTRYPOINT ["/app/docker-entrypoint.sh"]
