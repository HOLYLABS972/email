#!/bin/bash

# Script to restart SMTP service with updated configuration
echo "🔄 Restarting SMTP service with updated configuration..."

# Navigate to docker directory
cd /Users/admin/Documents/GitHub/email/docker

# Stop the smtp-service container
echo "⏹️  Stopping smtp-service container..."
docker-compose stop smtp-service

# Rebuild the smtp-service container
echo "🔨 Rebuilding smtp-service container..."
docker-compose build smtp-service

# Start the smtp-service container
echo "▶️  Starting smtp-service container..."
docker-compose up -d smtp-service

# Check if the service is running
echo "🔍 Checking service status..."
sleep 5
docker-compose ps smtp-service

# Test the health endpoint
echo "🏥 Testing health endpoint..."
curl -s http://localhost:5003/api/health | jq . || echo "Health check failed - service might still be starting"

echo "✅ SMTP service restart complete!"
echo "📧 You can now test your PrivateEmail configuration using the 'Test SMTP' button in your project settings."
