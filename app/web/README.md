# Dead Man's Switch Web App

Frontend interface for the Dead Man's Switch Solana program.

## Features

- 🔐 Wallet connection (Phantom, Solflare)
- ✨ Create dead man's switches
- ❤️ Send heartbeats
- 👥 Manage multiple beneficiaries
- 📊 View switch status and countdown
- 💰 Support for SOL and SPL tokens

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure the Solana program is built:
```bash
cd ../.. && anchor build
```

3. Run development server:
```bash
npm run dev
```

4. Open http://localhost:3000

## Build for Production

```bash
npm run build
npm start
```

## Deploy

### Vercel
```bash
vercel deploy
```

### Netlify
```bash
npm run build
netlify deploy --prod --dir=out
```

## Configuration

The app connects to devnet by default. To change the network, edit `src/components/WalletProvider.tsx`:

```typescript
const network = WalletAdapterNetwork.Mainnet; // or Devnet, Testnet
```
