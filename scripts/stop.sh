#!/bin/bash

# Stop all Dead Man's Switch services

echo "🛑 Stopping Dead Man's Switch services..."

# Stop relayer
echo "Stopping relayer..."
pkill -f "node.*relayer"

# Stop frontend
echo "Stopping frontend..."
pkill -f "next"

# Stop validator (optional - you might want to keep it running)
# echo "Stopping validator..."
# pkill -f "solana-test-validator"

echo "✅ All services stopped"
