# Multi-stage build for React TypeScript application
# Stage 1: Build stage
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app


# Copy package files first for better layer caching
COPY package.json package-lock.yaml* ./

# Install dependencies with optimized npm config
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:1.25-alpine AS production

# Install envsubst (part of gettext package)
RUN apk add --no-cache gettext

# Copy nginx config template
COPY nginx.conf /etc/nginx/nginx.conf.template

# Copy built application from build stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Set default backend URL
ENV BACKEND_URL=http://auth-service:8081

# Expose port
EXPOSE 3000

# Create startup script
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'envsubst "\$BACKEND_URL" < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Start with our custom script
CMD ["/docker-entrypoint.sh"]
