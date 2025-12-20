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

docker build -t deadman-relayer .
docker run -d --env-file .env deadman-relayer
## Deployment

### Using PM2 (VPS)
```bash
pm2 start dist/index.js --name deadman-relayer
pm2 save
pm2 startup
```

### Using Docker (recommended)
Build the image (from `app/relayer`):
```bash
cd app/relayer
docker build -t deadman-relayer:latest .
```

Run with a mounted keypair file:
```bash
docker run -d --name deadman-relayer \
	-v /full/path/to/relayer-keypair.json:/app/keypair.json:ro \
	-e RPC_URL=https://api.devnet.solana.com \
	-e PROGRAM_ID=BUE3LbNV3jkqGwE1E1ouvka3pcHuDvpLw4u9WT8oexxr \
	--restart unless-stopped \
	deadman-relayer:latest
```

If you cannot mount a file, pass the keypair JSON via `KEYPAIR_JSON` env var (be careful with secrets):
```bash
export KEYPAIR_JSON="$(cat /path/to/keypair.json)"
docker run -d --name deadman-relayer \
	-e KEYPAIR_JSON="$KEYPAIR_JSON" \
	-e RPC_URL=https://api.devnet.solana.com \
	-e PROGRAM_ID=BUE3LbNV3jkqGwE1E1ouvka3pcHuDvpLw4u9WT8oexxr \
	--restart unless-stopped \
	deadman-relayer:latest
```

Using `docker-compose` (local development):
```bash
LOCAL_KEYPAIR_PATH=/full/path/to/relayer-keypair.json docker-compose up -d --build
```

### Deploy to managed services
- **Render / Fly / Railway**: Push Docker image or connect repo, set secrets (`KEYPAIR_JSON` or file write-in startup), and set `RPC_URL` / `PROGRAM_ID`.
- **Vercel**: Not suited for long-running background workers; prefer serverless cron approach (see repo planning).

### Notes
- Never commit keypair files to Git.
- Prefer mounting a read-only keypair file or using platform secrets.
- Configure log retention and auto-restart on your host.

## GitHub Actions + Managed Deploy (templates)

This repo includes example GitHub Actions workflows and platform config templates to help deploy the relayer automatically:

- `.github/workflows/deploy-relayer-render.yml` — builds and pushes Docker image, then triggers a Render deploy (requires `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `RENDER_API_KEY`, `RENDER_SERVICE_ID` set in GitHub Secrets).
- `.github/workflows/deploy-relayer-fly.yml` — builds and pushes Docker image, then uses `flyctl` to deploy to Fly (requires `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `FLY_API_TOKEN` in GitHub Secrets).
- `app/relayer/fly.toml` — Fly config template (edit `app` field and image name).
- `app/relayer/render.yaml` — Render service template (edit image and settings).

To use these workflows:
1. Push the repository to GitHub and create a `main` branch.
2. In your GitHub repository settings > Secrets, add the required secrets (see above).
3. For Render: create the service or use `render.yaml`, then set the `RENDER_SERVICE_ID` secret to your service ID.
4. For Fly: set `FLY_API_TOKEN` secret and update `fly.toml` with your app name.
5. Trigger the workflow from GitHub Actions or push to the `main` branch.

If you want, I can finish deploying the relayer for you — I will need one of the following from you:
- For Render: a Render API key (with deploy permissions) and the target `RENDER_SERVICE_ID`, or permission to create a service in your Render account.
- For Fly: a Fly API token with rights to deploy to your app, and the Fly app name (or permission to create one).

Provide the chosen platform and token as GitHub repository secrets (recommended) or share them securely and I can trigger the deployment on your behalf. I will not store these tokens permanently.
