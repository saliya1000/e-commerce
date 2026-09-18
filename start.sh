#!/bin/bash
# start.sh - Quickstart script for the I Love Shopping e-commerce platform

echo "Starting I Love Shopping platform..."

# Stop any running containers just in case
docker compose down

# Build and start in detached mode
docker compose up --build -d

echo "=========================================================="
echo "Services started! The application will be available at:"
echo "Frontend: https://localhost"
echo "Backend API: http://localhost:3000"
echo "Prisma Studio (DB Admin): http://localhost:5555"
echo "=========================================================="
echo "Note: It may take a minute for the database and backend to fully initialize."
echo "To view logs, run: docker compose logs -f"
