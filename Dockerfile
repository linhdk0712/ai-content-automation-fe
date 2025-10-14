# Multi-stage Dockerfile for React/Vite application
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install production dependencies only (faster build)
RUN npm install

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

# Build the application (skip TypeScript check for faster build)
RUN npm run build

# Stage 2: Production stage
FROM nginx:1.25-alpine AS production

# Configure backend origin for nginx proxy (default dev: host.docker.internal:8080)
ARG BACKEND_ORIGIN=http://host.docker.internal:8080
ENV BACKEND_ORIGIN=${BACKEND_ORIGIN}

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration and inject backend origin
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|http://localhost:8081|${BACKEND_ORIGIN}|g" /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html



# Expose port
EXPOSE 3002

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
