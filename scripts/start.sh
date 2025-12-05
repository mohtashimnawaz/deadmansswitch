#!/bin/bash

# Dead Man's Switch - Quick Start Script
# This script sets up and runs the entire project locally

set -e

echo "🚀 Dead Man's Switch - Quick Start"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v cargo >/dev/null 2>&1 || { echo "❌ Rust is required but not installed. Aborting." >&2; exit 1; }
command -v solana >/dev/null 2>&1 || { echo "❌ Solana CLI is required but not installed. Aborting." >&2; exit 1; }
command -v anchor >/dev/null 2>&1 || { echo "❌ Anchor is required but not installed. Aborting." >&2; exit 1; }

echo "✅ All prerequisites met"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
yarn install
echo ""

# Build program
echo "🔨 Building Solana program..."
anchor build
echo ""

# Check if validator is running
if ! pgrep -x "solana-test-va" > /dev/null; then
    echo "${YELLOW}⚠️  Local validator not running${NC}"
    echo "Starting local validator in background..."
    solana-test-validator > validator.log 2>&1 &
    VALIDATOR_PID=$!
    echo "Validator PID: $VALIDATOR_PID"
    echo "Waiting for validator to start..."
    sleep 10
else
    echo "✅ Validator already running"
fi

# Configure Solana CLI
echo "⚙️  Configuring Solana CLI..."
solana config set --url localhost
echo ""

# Deploy program
echo "🚀 Deploying program to localnet..."
anchor deploy
echo ""

# Get program ID
PROGRAM_ID=$(solana address -k target/deploy/deadmansswitch-keypair.json)
echo "Program ID: $PROGRAM_ID"
echo ""

# Setup relayer
echo "🤖 Setting up relayer..."
cd app/relayer

if [ ! -f .env ]; then
    cp .env.example .env
    sed -i.bak "s/BUE3LbNV3jkqGwE1E1ouvka3pcHuDvpLw4u9WT8oexxr/$PROGRAM_ID/" .env
    rm .env.bak
fi

npm install
npm run build
echo ""

# Start relayer in background
echo "Starting relayer..."
npm start > ../../relayer.log 2>&1 &
RELAYER_PID=$!
echo "Relayer PID: $RELAYER_PID"
cd ../..
echo ""

# Setup frontend
echo "🌐 Setting up frontend..."
cd app/web
npm install
echo ""

echo "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Connect your Phantom wallet"
echo "   3. Create a new Dead Man's Switch"
echo ""
echo "🔍 Monitoring:"
echo "   - Relayer logs: tail -f relayer.log"
echo "   - Validator logs: tail -f validator.log"
echo "   - Program logs: solana logs"
echo ""
echo "🛑 To stop services:"
echo "   - Kill relayer: kill $RELAYER_PID"
if [ ! -z "$VALIDATOR_PID" ]; then
    echo "   - Kill validator: kill $VALIDATOR_PID"
fi
echo "   - Or run: ./scripts/stop.sh"
echo ""

# Start frontend (this will block)
echo "Starting frontend on http://localhost:3000..."
npm run dev
