# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Use the PORT environment variable provided by GCP (Cloud Run / App Engine)
# Cloud Run sets the PORT env var to 8080 by default.
ENV PORT=8080
EXPOSE 8080

# Start the application
CMD ["node", "dist/server.js"]
