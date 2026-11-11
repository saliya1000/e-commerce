#!/bin/bash
# start.sh - Quickstart script for the I Love Shopping e-commerce platform

echo "Starting I Love Shopping platform..."

# Stop any running containers (use --clean or -v to wipe volumes)
if [ "$1" == "--clean" ] || [ "$1" == "-v" ]; then
    echo "Performing clean reset (removing persistent volumes)..."
    docker compose down -v
else
    docker compose down
fi

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
