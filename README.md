# Dead Man's Switch - Solana

A hybrid dead man's switch implementation on Solana that automatically distributes your assets to beneficiaries if you stop sending heartbeats.

## 🏗️ Architecture

This is a **hybrid architecture** combining:
- **On-chain (Solana Program)**: Stores switch state, manages escrow, and enforces distribution logic
- **Off-chain (Relayer)**: Monitors heartbeat deadlines and triggers expiry
- **Frontend (Web App)**: User interface for creating switches and sending heartbeats

```
┌─────────────────┐
│   Web Frontend  │
│  (Next.js)      │
└────────┬────────┘
         │
         │ RPC Calls
         ▼
┌─────────────────────────┐
│   Solana Program        │
│   (Anchor/Rust)         │
│                         │
│  • Switch State         │
│  • Escrow PDAs          │
│  • Fund Distribution    │
└─────────────────────────┘
         ▲
         │ Monitor & Trigger
         │
┌────────┴────────┐
│  Keeper/Relayer │
│  (Node.js/TS)   │
└─────────────────┘
```

## ✨ Features

- ✅ **Non-custodial**: Funds stay in program-owned escrow PDAs
- ✅ **Flexible timeouts**: Set custom heartbeat intervals
- ✅ **Multiple beneficiaries**: Distribute to up to 10 beneficiaries with custom shares
- ✅ **SOL & SPL support**: Works with native SOL and SPL tokens
- ✅ **Cancellable**: Owner can cancel and withdraw funds anytime
- ✅ **Automatic expiry**: Off-chain relayer triggers distribution when deadline passes
- ✅ **Transparent**: All logic is on-chain and verifiable

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.31+
- Yarn or npm

### Installation

1. Clone the repository:
```bash
git clone <your-repo>
cd deadmansswitch
```

2. Install dependencies:
```bash
yarn install
```

3. Build the program:
```bash
anchor build
```

4. Run tests:
```bash
anchor test
```

### Local Development

1. Start local validator:
```bash
solana-test-validator
```

2. Deploy the program:
```bash
anchor deploy
```

3. Start the relayer:
```bash
cd app/relayer
npm install
cp .env.example .env
npm run dev
```

4. Start the frontend:
```bash
cd app/web
npm install
npm run dev
```

5. Open http://localhost:3000

## 📚 Program Instructions

### `initialize_switch`
Create a new dead man's switch.

**Parameters:**
- `timeout_seconds`: Time in seconds before expiry (e.g., 86400 = 24 hours)
- `beneficiaries`: List of beneficiaries with addresses and share percentages (basis points)
- `token_type`: Either SOL or SPL token

**Example:**
```typescript
await program.methods
  .initializeSwitch(
    86400, // 24 hours
    [
      { address: beneficiary1, shareBps: 6000 }, // 60%
      { address: beneficiary2, shareBps: 4000 }, // 40%
    ],
    { sol: {} }
  )
  .accounts({ switch: switchPda, escrow: escrowPda, owner: wallet.publicKey })
  .rpc();
```

### `send_heartbeat`
Extend the deadline by sending a heartbeat (proof of life).

```typescript
await program.methods
  .sendHeartbeat()
  .accounts({ switch: switchPda, owner: wallet.publicKey })
  .rpc();
```

### `trigger_expiry`
Mark the switch as expired (callable by anyone after deadline passes).

```typescript
await program.methods
  .triggerExpiry()
  .accounts({ switch: switchPda })
  .rpc();
```

### `distribute_sol` / `distribute_spl`
Distribute funds to a beneficiary (must be called for each beneficiary).

```typescript
await program.methods
  .distributeSol()
  .accounts({
    switch: switchPda,
    escrow: escrowPda,
    beneficiary: beneficiaryAddress,
  })
  .rpc();
```

### `cancel_switch`
Cancel the switch (only owner, only while active).

```typescript
await program.methods
  .cancelSwitch()
  .accounts({ switch: switchPda, owner: wallet.publicKey })
  .rpc();
```

### `withdraw_sol`
Withdraw funds after cancellation.

```typescript
await program.methods
  .withdrawSol()
  .accounts({ switch: switchPda, escrow: escrowPda, owner: wallet.publicKey })
  .rpc();
```

## 🔧 Configuration

### Program
- Max beneficiaries: 10
- Share distribution: Must total 10,000 basis points (100%)
- Minimum timeout: 1 second (configurable)

### Relayer
Edit `app/relayer/.env`:
```env
SOLANA_RPC_URL=http://127.0.0.1:8899
RELAYER_KEYPAIR_PATH=~/.config/solana/id.json
PROGRAM_ID=<your-program-id>
CHECK_INTERVAL_MS=60000
```

### Frontend
Edit `app/web/src/components/WalletProvider.tsx` to change network:
```typescript
const network = WalletAdapterNetwork.Mainnet; // or Devnet
```

## 🧪 Testing

Run comprehensive tests:
```bash
anchor test
```

Individual test suites:
```bash
anchor test -- --grep "initialize_switch"
anchor test -- --grep "send_heartbeat"
anchor test -- --grep "distribute"
```

## 🚢 Deployment

### Deploy to Devnet

1. Switch to devnet:
```bash
solana config set --url devnet
```

2. Airdrop SOL:
```bash
solana airdrop 2
```

3. Update `Anchor.toml`:
```toml
[provider]
cluster = "devnet"
```

4. Deploy:
```bash
anchor build
anchor deploy
```

5. Update program ID in:
   - `lib.rs`: `declare_id!("...")`
   - `Anchor.toml`: `[programs.devnet]`
   - Relayer `.env`: `PROGRAM_ID=...`
   - Frontend `useProgram.ts`: Update IDL import

### Deploy Relayer

#### Option 1: Render
1. Create new Web Service
2. Connect GitHub repo
3. Set build command: `cd app/relayer && npm install && npm run build`
4. Set start command: `cd app/relayer && npm start`
5. Add environment variables

#### Option 2: Railway
1. `railway init`
2. `railway up`
3. Configure environment variables in dashboard

#### Option 3: Fly.io
```bash
cd app/relayer
fly launch
fly secrets set SOLANA_RPC_URL=... PROGRAM_ID=...
fly deploy
```

### Deploy Frontend

#### Vercel
```bash
cd app/web
vercel deploy
```

#### Netlify
```bash
cd app/web
npm run build
netlify deploy --prod
```

## 📖 Use Cases

1. **Digital inheritance**: Automatically transfer crypto assets to heirs
2. **Emergency backup**: Distribute funds if you become incapacitated
3. **Business continuity**: Transfer control to partners if you go missing
4. **Whistleblower protection**: Release documents if you stop checking in
5. **Trust funds**: Time-locked distributions with proof-of-life requirement

## 🔐 Security Considerations

- ✅ Escrow PDAs are derived deterministically (no one can steal funds)
- ✅ Only owner can send heartbeats or cancel
- ✅ Expiry only works when deadline has passed (enforced on-chain)
- ✅ Re-entrancy protection (status flag prevents double-spend)
- ✅ Beneficiary shares validated (must sum to 100%)
- ⚠️ Relayer is permissionless (anyone can trigger expiry, but funds only go to beneficiaries)

### Recommended Enhancements

1. **Multi-signature recovery**: Require multiple guardians to override
2. **Hash-based heartbeats**: Privacy-preserving proof-of-life
3. **Relayer rewards**: Incentivize timely expiry triggering
4. **Emergency contacts**: Allow designated contacts to check in on your behalf
5. **Gradual distribution**: Release funds in stages over time

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

## 📝 License

MIT

## 🙏 Acknowledgments

Built with:
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Next.js](https://nextjs.org/)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)

## 📞 Support

- Documentation: [Anchor Book](https://book.anchor-lang.com/)
- Discord: [Solana Discord](https://discord.gg/solana)
- Issues: [GitHub Issues](your-repo/issues)

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always test thoroughly before using with real funds.