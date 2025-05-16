# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set NODE_ENV
ENV NODE_ENV production

WORKDIR /usr/src/app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/src/schema.gql ./dist/schema.gql

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
# Change ownership of the working directory to the non-root user
RUN chown -R appuser:appgroup /usr/src/app
USER appuser

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main"]
