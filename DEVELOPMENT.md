# Development Guide

## Project Structure

```
deadmansswitch/
├── programs/
│   └── deadmansswitch/
│       ├── src/
│       │   └── lib.rs           # Solana program (Rust/Anchor)
│       └── Cargo.toml
├── app/
│   ├── relayer/                 # Off-chain keeper service
│   │   ├── src/
│   │   │   ├── index.ts         # Entry point
│   │   │   ├── relayer.ts       # Core relayer logic
│   │   │   └── logger.ts        # Logging setup
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                     # Frontend Next.js app
│       ├── src/
│       │   ├── app/             # Next.js pages
│       │   ├── components/      # React components
│       │   └── hooks/           # Custom hooks
│       ├── package.json
│       └── next.config.mjs
├── tests/
│   └── deadmansswitch.ts        # Integration tests
├── Anchor.toml                  # Anchor configuration
└── package.json
```

## Development Workflow

### 1. Program Development

Edit `programs/deadmansswitch/src/lib.rs`:

```rust
// Add new instruction
pub fn new_instruction(ctx: Context<NewInstruction>) -> Result<()> {
    // Implementation
    Ok(())
}

// Add new account struct
#[derive(Accounts)]
pub struct NewInstruction<'info> {
    // Account constraints
}
```

Build and test:
```bash
anchor build
anchor test
```

### 2. Relayer Development

Edit `app/relayer/src/relayer.ts`:

```typescript
// Customize monitoring logic
private async checkAndTriggerExpiredSwitches(): Promise<void> {
    // Your custom logic
}
```

Run in development mode:
```bash
cd app/relayer
npm run dev
```

### 3. Frontend Development

Edit components in `app/web/src/components/`:

```typescript
// Example: Add new feature
export const NewFeature: FC = () => {
    const program = useProgram();
    // Your component logic
};
```

Run dev server:
```bash
cd app/web
npm run dev
```

## Common Tasks

### Update Program ID

After deploying to a new cluster:

1. **lib.rs**:
```rust
declare_id!("NewProgramId...");
```

2. **Anchor.toml**:
```toml
[programs.devnet]
deadmansswitch = "NewProgramId..."
```

3. **Rebuild**:
```bash
anchor build
```

4. **Update frontend**: The IDL is automatically regenerated

### Add New Test

In `tests/deadmansswitch.ts`:

```typescript
describe("new_feature", () => {
  it("does something", async () => {
    const tx = await program.methods
      .newInstruction()
      .accounts({ /* accounts */ })
      .rpc();
    
    // Assertions
  });
});
```

### Debug Issues

#### Program Logs
```bash
solana logs
```

#### Relayer Logs
```bash
cd app/relayer
npm run dev
# Logs output to console and relayer-combined.log
```

#### Frontend Console
Open browser DevTools → Console

### Run in Production Mode

#### Relayer
```bash
cd app/relayer
npm run build
npm start
```

#### Frontend
```bash
cd app/web
npm run build
npm start
```

## Environment Setup

### Local Validator Configuration

Create `test-ledger/` with custom config:
```bash
solana-test-validator \
  --ledger test-ledger \
  --bpf-program <program-id> target/deploy/deadmansswitch.so \
  --reset
```

### Multiple Clusters

Switch between clusters:
```bash
# Localnet
solana config set --url localhost

# Devnet
solana config set --url devnet

# Mainnet
solana config set --url mainnet-beta
```

## Performance Optimization

### Program Size
```bash
# Check program size
ls -lh target/deploy/deadmansswitch.so

# Optimize build
anchor build -- --release
```

### Relayer Performance
- Adjust `CHECK_INTERVAL_MS` based on load
- Use rate limiting for RPC calls
- Consider caching switch accounts

### Frontend Optimization
```bash
# Analyze bundle size
cd app/web
npm run build
```

## Monitoring & Debugging

### Program Account Inspection
```bash
solana account <switch-pda>
```

### RPC Health
```bash
solana cluster-version
solana transaction-history <signature>
```

### Relayer Health Check
Add to `relayer.ts`:
```typescript
public getStatus() {
  return {
    isRunning: this.isRunning,
    lastCheck: this.lastCheckTime,
    switchesMonitored: this.switchCount,
  };
}
```

## Best Practices

### Program Development
- Always validate inputs
- Use `require!` for constraints
- Implement proper error codes
- Add comprehensive logs with `msg!`
- Test edge cases thoroughly

### Relayer Development
- Handle RPC errors gracefully
- Implement exponential backoff
- Log all actions
- Monitor for failures
- Use transaction confirmation

### Frontend Development
- Handle wallet connection states
- Show loading states
- Display meaningful errors
- Validate user input
- Cache program accounts when possible

## Troubleshooting

### "Program failed to deploy"
```bash
# Increase compute units
solana program deploy --max-len 100000 target/deploy/deadmansswitch.so
```

### "Anchor IDL not found"
```bash
anchor build
# IDL regenerated in target/idl/
```

### "Relayer cannot connect"
Check RPC URL:
```bash
curl <RPC_URL> -X POST -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

### "Frontend build errors"
Clear cache:
```bash
cd app/web
rm -rf .next node_modules
npm install
npm run dev
```

## Testing Strategies

### Unit Tests
Test individual instructions in isolation.

### Integration Tests
Test full workflows (create → fund → heartbeat → expire → distribute).

### Load Tests
Use `solana-bench-tps` to stress test.

### End-to-End Tests
Automated browser tests with Playwright:
```bash
cd app/web
npx playwright test
```

## CI/CD

Example GitHub Actions workflow:

```yaml
name: Test and Deploy

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions-rs/toolchain@v1
      - name: Install Anchor
        run: cargo install --git https://github.com/coral-xyz/anchor anchor-cli
      - name: Build and Test
        run: |
          anchor build
          anchor test
```

## Further Resources

- [Anchor Documentation](https://book.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Program Examples](https://github.com/solana-labs/solana-program-library)
