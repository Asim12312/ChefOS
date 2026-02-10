# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build if needed, 
# but for backend usually clean install is enough)
RUN npm ci

# Copy source code
COPY . .

# Production Stage
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy source code from builder (or local if no build step needed for raw JS)
# Since we are using raw JS modules, we just copy the src. 
# If we had a build step (TypeScript), we would copy from builder.
COPY . .

# Environment setup
ENV NODE_ENV=production
ENV PORT=5000

# Metadata
EXPOSE 5000

# Start command
CMD ["node", "server.js"]
