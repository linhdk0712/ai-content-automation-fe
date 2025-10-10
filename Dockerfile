# Multi-stage build for React TypeScript application
# Stage 1: Build stage
FROM node:24-alpine AS builder

# Set working directory
WORKDIR /app


# Copy package files first for better layer caching
COPY package.json package-lock.yaml* ./

# Install dependencies with optimized npm config
RUN npm ci --only=production --no-audit --no-fund --prefer-offline

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production stage with Nginx
FROM nginx:1.25-alpine AS production

# Remove default nginx config and copy nginx configuration in one layer
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built application from build stage
COPY --from=builder /app/build /usr/share/nginx/html

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]