#!/bin/bash

echo "Starting Atenea Bot..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Start the application
echo "Starting application on port ${PORT:-8080}"
node dist/main.js