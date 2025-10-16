# Multi-stage Dockerfile for React/Vite application
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Clean install with increased memory
RUN npm ci --legacy-peer-deps --maxsockets 1

# Copy source code
COPY . .

# Build arguments for environment configuration
ARG NODE_ENV=production
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VERCEL=1
ARG DOCKER=1

# Set environment variables
ENV NODE_ENV=${NODE_ENV}
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
ENV VERCEL=${VERCEL}
ENV DOCKER=${DOCKER}

# Increase Node.js memory limit and build
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build && \
    echo "Build completed. Checking output files:" && \
    ls -lh dist/assets/js/ && \
    echo "Verifying main JS file is not empty:" && \
    find dist/assets/js -name "*.js" -exec wc -c {} \;

# Stage 2: Production stage
FROM nginx:1.25-alpine AS production

# Configure backend origin
ARG BACKEND_ORIGIN=http://host.docker.internal:8081
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|http://localhost:8081|${BACKEND_ORIGIN}|g" /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Verify files were copied correctly
RUN echo "Verifying nginx html directory:" && \
    ls -lh /usr/share/nginx/html/assets/js/ && \
    find /usr/share/nginx/html/assets/js -name "*.js" -exec wc -c {} \;

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]