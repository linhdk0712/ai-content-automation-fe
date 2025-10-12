# Build stage for Vite React TypeScript application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Copy environment file
COPY .env .env

# Build the application for production
RUN npm run build

# Expose port
EXPOSE 3000

# Start nginx
CMD ["npm run dev"]
