# Dead Man's Switch Relayer

Off-chain keeper service that monitors Dead Man's Switch contracts and triggers expiry when heartbeat deadlines pass.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. Build:
```bash
npm run build
```

4. Run:
```bash
npm start
```

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

## Configuration

- `SOLANA_RPC_URL`: RPC endpoint (default: localnet)
- `RELAYER_KEYPAIR_PATH`: Path to relayer wallet keypair
- `PROGRAM_ID`: Dead Man's Switch program ID
- `CHECK_INTERVAL_MS`: How often to check for expired switches (default: 60000ms)
- `MAX_RETRIES`: Max retry attempts for failed transactions (default: 3)
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Deployment

### Using PM2
```bash
pm2 start dist/index.js --name deadman-relayer
pm2 save
pm2 startup
```

### Using Docker
```bash
docker build -t deadman-relayer .
docker run -d --env-file .env deadman-relayer
```

### Cloud Platforms
- **Render**: Connect repo and set environment variables
- **Railway**: Deploy from GitHub with automatic restarts
- **Fly.io**: Use `fly launch` and configure secrets
