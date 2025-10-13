# Build stage for Vite React TypeScript application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Set environment variables for build
ENV CI=false
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm install --silent && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application for production (TypeScript check can be done in CI/CD)
RUN npx vite build

# Remove devDependencies after build to reduce image size
RUN npm prune --production

# Production stage
FROM nginx:1.25-alpine AS production

# Install bash and wget for env.sh script and health check
RUN apk add --no-cache bash dumb-init wget

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configurations
COPY nginx-main.conf /etc/nginx/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set working directory
WORKDIR /usr/share/nginx/html

# Copy environment script and make it executable
COPY ./env.sh .
RUN chmod +x env.sh

# Create non-root user for nginx worker processes
RUN addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G appuser -g appuser appuser

# Ensure proper permissions for nginx directories
RUN chown -R appuser:appuser /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["/bin/bash", "-c", "/usr/share/nginx/html/env.sh && nginx -g 'daemon off;'"]
