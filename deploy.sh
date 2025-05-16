#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Build the Docker image
echo "📦 Building Docker image..."
docker compose build --no-cache

# Verify environment variables
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with the required environment variables:"
    echo "MONGODB_URI=your_mongodb_connection_string"
    exit 1
fi

# Check if ports are available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "❌ Error: Port 3000 is already in use"
    exit 1
fi

# Start the containers
echo "🚀 Starting containers..."
docker compose up -d

# Wait for health check
echo "🏥 Waiting for health check..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ Service is healthy!"
        exit 0
    fi
    echo "⏳ Waiting for service to be healthy... ($i/30)"
    sleep 2
done

echo "❌ Service failed to become healthy within timeout"
docker compose logs
exit 1
