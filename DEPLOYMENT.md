# Deployment Checklist

## Pre-Deployment

### Program
- [ ] All tests passing: `anchor test`
- [ ] Program optimized: `anchor build --release`
- [ ] Security audit completed (if mainnet)
- [ ] Program ID updated in all locations
- [ ] Compute budget sufficient for all instructions

### Relayer
- [ ] Dependencies installed: `cd app/relayer && npm install`
- [ ] Environment variables configured
- [ ] Build successful: `npm run build`
- [ ] Relayer wallet funded
- [ ] RPC endpoint tested and reliable
- [ ] Monitoring/alerting set up

### Frontend
- [ ] Dependencies installed: `cd app/web && npm install`
- [ ] Build successful: `npm run build`
- [ ] Environment variables set
- [ ] Wallet adapters configured for target network
- [ ] Domain/hosting configured

## Devnet Deployment

### 1. Prepare Environment
```bash
# Switch to devnet
solana config set --url devnet

# Check wallet
solana address
solana balance

# Airdrop if needed
solana airdrop 2
```

### 2. Deploy Program
```bash
# Build
anchor build

# Deploy
anchor deploy

# Get program ID
solana address -k target/deploy/deadmansswitch-keypair.json
```

### 3. Update Program ID

#### lib.rs
```rust
declare_id!("YOUR_NEW_PROGRAM_ID");
```

#### Anchor.toml
```toml
[programs.devnet]
deadmansswitch = "YOUR_NEW_PROGRAM_ID"
```

#### Rebuild
```bash
anchor build
```

### 4. Deploy Relayer

#### Render.com
1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - **Build Command**: `cd app/relayer && npm install && npm run build`
   - **Start Command**: `cd app/relayer && npm start`
4. Add environment variables:
   - `SOLANA_RPC_URL`: https://api.devnet.solana.com
   - `RELAYER_KEYPAIR_PATH`: (upload keypair as secret file)
   - `PROGRAM_ID`: YOUR_NEW_PROGRAM_ID
   - `CHECK_INTERVAL_MS`: 60000
   - `MAX_RETRIES`: 3
   - `LOG_LEVEL`: info
5. Deploy

#### Verify Relayer
- Check logs for "Relayer started"
- Monitor for switch detection
- Test expiry triggering

### 5. Deploy Frontend

#### Vercel
```bash
cd app/web

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Configure environment:
- No special env vars needed (program ID from IDL)

#### Verify Frontend
- [ ] Loads without errors
- [ ] Wallet connects successfully
- [ ] Can create switch
- [ ] Can send heartbeat
- [ ] Displays switch status correctly

## Mainnet Deployment

⚠️ **CRITICAL**: Only deploy to mainnet after thorough testing!

### Pre-Mainnet Checklist
- [ ] Extensive testing on devnet (minimum 2 weeks)
- [ ] Security audit completed
- [ ] Bug bounty program considered
- [ ] Legal review (depending on jurisdiction)
- [ ] Emergency pause mechanism (optional)
- [ ] Insurance/guarantees for users (optional)

### 1. Prepare Mainnet Wallet
```bash
# Create separate mainnet wallet
solana-keygen new -o ~/.config/solana/mainnet.json

# Fund with real SOL
# Calculate: deployment cost + relayer operations + buffer
# Estimated: 5-10 SOL for initial deployment
```

### 2. Deploy to Mainnet
```bash
# Switch to mainnet
solana config set --url mainnet-beta
solana config set --keypair ~/.config/solana/mainnet.json

# Verify balance
solana balance

# Deploy
anchor build --release
anchor deploy

# Verify deployment
solana program show <PROGRAM_ID>
```

### 3. Update All References
Same as devnet, but with mainnet program ID

### 4. Configure Production Services

#### Relayer
- Use premium RPC provider (Helius, QuickNode, Triton)
- Set up monitoring (Grafana, DataDog)
- Configure alerting (PagerDuty, Slack)
- Enable error tracking (Sentry)
- Set up log aggregation

#### Frontend
- Enable analytics (PostHog, Mixpanel)
- Set up error monitoring (Sentry)
- Configure CDN
- Enable rate limiting
- Add terms of service

### 5. Launch Checklist
- [ ] All services deployed and running
- [ ] Monitoring dashboards configured
- [ ] Alert recipients configured
- [ ] Documentation published
- [ ] Support channels set up (Discord, email)
- [ ] Announcement prepared
- [ ] Demo video/tutorial ready

## Post-Deployment

### Monitoring
- [ ] Program account balance
- [ ] Relayer uptime
- [ ] Transaction success rate
- [ ] User activity metrics
- [ ] Error rates

### Maintenance
- [ ] Regular RPC endpoint health checks
- [ ] Relayer wallet funding
- [ ] Log review and cleanup
- [ ] Performance optimization
- [ ] User feedback collection

## Rollback Plan

If critical issues are discovered:

1. **Immediate**:
   - Stop relayer
   - Add warning banner to frontend
   - Pause new switch creation (if pause implemented)

2. **Investigation**:
   - Review logs
   - Identify root cause
   - Test fix on devnet

3. **Resolution**:
   - Deploy fix
   - Restart services
   - Communicate with users

## Emergency Contacts

- **Solana Status**: https://status.solana.com/
- **RPC Provider Support**: [your provider]
- **Hosting Support**: [your provider]
- **On-call Engineer**: [contact info]

## Success Criteria

- [ ] Zero failed transactions (except expected errors)
- [ ] Relayer uptime > 99.5%
- [ ] Frontend load time < 2s
- [ ] All switches functioning correctly
- [ ] No user complaints about fund security

## Notes

- Keep deployment keypairs secure and backed up
- Document all configuration changes
- Maintain changelog
- Regular security updates for dependencies
