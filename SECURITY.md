# Security Considerations

## Overview

This document outlines security considerations, potential vulnerabilities, and best practices for the Dead Man's Switch implementation.

## ✅ Current Security Features

### 1. Escrow Protection
- **PDA-based escrow**: Funds are held in Program Derived Addresses (PDAs)
- **No private key access**: No one (including developers) can access PDA funds directly
- **Deterministic derivation**: PDAs derived from `["escrow", owner_pubkey]`

### 2. Access Control
- **Owner-only operations**: Only the switch owner can send heartbeats or cancel
- **Verified beneficiaries**: Funds only distributed to pre-approved addresses
- **Share validation**: Beneficiary shares must sum to exactly 10,000 basis points

### 3. State Machine Protection
- **Status flags**: Prevents double-spending and re-entrancy
- **Atomic state changes**: Status updated before fund transfers
- **Deadline enforcement**: On-chain timestamp validation

### 4. Input Validation
- **Beneficiary limits**: Maximum 10 beneficiaries
- **Share distribution**: Must equal 100% (10,000 basis points)
- **Timeout validation**: Must be positive value
- **Address validation**: All pubkeys validated by Solana runtime

## ⚠️ Potential Vulnerabilities & Mitigations

### 1. Relayer Dependency

**Risk**: If relayer goes offline, switches won't be triggered automatically.

**Mitigations**:
- Expiry triggering is permissionless - anyone can call `trigger_expiry`
- Multiple relayers can monitor the same switches
- Frontend should show "trigger manually" option when expired
- Implement redundant relayers in different regions

**Recommended Enhancement**:
```rust
// Add relayer incentive
pub fn trigger_expiry_with_reward(
    ctx: Context<TriggerExpiryReward>,
    relayer: Pubkey
) -> Result<()> {
    // Trigger expiry
    // Transfer small reward to relayer from escrow
}
```

### 2. Clock Manipulation

**Risk**: Solana clock can drift, leading to incorrect deadline calculations.

**Mitigations**:
- Clock drift is minimal on Solana (< 1 minute typically)
- Use `Clock::get()?.unix_timestamp` for consistency
- Relayer checks frequently (default 60s)

**Not a critical risk** since:
- Drift is small relative to typical timeouts (hours/days)
- Beneficiaries are incentivized to wait for actual deadline

### 3. Front-Running

**Risk**: Relayer or malicious actor could front-run legitimate heartbeats.

**Mitigations**:
- Heartbeats are owner-signed transactions
- Transaction ordering is determined by validators
- MEV is less prevalent on Solana than EVM chains

**Low risk** due to:
- Owner always has priority (can increase priority fees)
- Front-running provides no benefit to attacker

### 4. Dust/Rent-Exempt Amounts

**Risk**: Very small amounts left in escrow after distribution.

**Mitigations**:
- Rent-exempt reserve is protected in distribution
- Basis point math prevents accumulation of rounding errors
- Final beneficiary gets any remainder

**Example**:
```rust
let distributable = escrow_balance.saturating_sub(rent_exempt);
```

### 5. Malicious Program Upgrade

**Risk**: Program authority could upgrade to malicious code.

**Mitigations**:
- Set program to **immutable** after deployment
- Use multisig for upgrade authority
- Add timelock for upgrades

**Recommended**:
```bash
# Make program immutable
solana program set-upgrade-authority <PROGRAM_ID> --final

# OR use multisig
solana program set-upgrade-authority <PROGRAM_ID> <MULTISIG_ADDRESS>
```

### 6. SPL Token Account Issues

**Risk**: Beneficiary token accounts might not exist.

**Mitigations**:
- Require associated token accounts pre-created
- Add instruction to create accounts if needed
- Document requirement clearly

**Recommended Enhancement**:
```rust
use anchor_spl::associated_token::AssociatedToken;

// Auto-create token account in distribution
#[account(
    init_if_needed,
    payer = payer,
    associated_token::mint = mint,
    associated_token::authority = beneficiary
)]
pub beneficiary_token_account: Account<'info, TokenAccount>,
```

## 🔒 Best Practices for Users

### For Switch Owners

1. **Test First**
   - Create test switch on devnet
   - Use small amounts initially
   - Verify full workflow before production

2. **Secure Your Wallet**
   - Use hardware wallet for large amounts
   - Keep seed phrase in secure location
   - Consider multisig for high-value switches

3. **Set Appropriate Timeout**
   - Too short: Risk of accidental expiry
   - Too long: Funds locked longer than necessary
   - Recommended: 7-30 days minimum

4. **Verify Beneficiaries**
   - Double-check all addresses
   - Test send small amount first
   - Ensure beneficiaries know about the switch

5. **Regular Heartbeats**
   - Set calendar reminders
   - Use multiple reminder methods
   - Consider automated heartbeat (with caution)

6. **Monitor Your Switch**
   - Check deadline regularly
   - Verify escrow balance
   - Watch for unexpected status changes

### For Beneficiaries

1. **Verify Receipt**
   - Check if you're listed as beneficiary
   - Note your share percentage
   - Know the expected amount

2. **Wait for Expiry**
   - Don't trigger early
   - Respect owner's privacy
   - Contact owner if concerned

3. **Claim Promptly**
   - Once expired, claim your share
   - Don't delay (security risk)
   - Verify amount received

## 🛡️ Audit Checklist

Before mainnet deployment, ensure:

### Smart Contract
- [ ] All arithmetic uses checked math (no overflows)
- [ ] No unvalidated CPIs
- [ ] All PDAs properly validated
- [ ] Account ownership verified
- [ ] Signer requirements enforced
- [ ] Re-entrancy protection
- [ ] Proper error handling
- [ ] No panics in production code

### Testing
- [ ] 100% instruction coverage
- [ ] Edge case testing
- [ ] Fuzz testing
- [ ] Load testing
- [ ] Security audit by professionals

### Operations
- [ ] Upgrade authority managed securely
- [ ] Monitoring in place
- [ ] Incident response plan
- [ ] Backup relayers configured

## 🚨 Known Limitations

1. **No Privacy**: All switch details are public on-chain
2. **No Modification**: Can't change beneficiaries after creation (must cancel & recreate)
3. **Single Token Type**: Each switch supports one token type only
4. **No Partial Withdrawals**: Must cancel entire switch
5. **Relayer Dependency**: Requires active relayer for automatic expiry

## 📋 Recommended Enhancements

### High Priority

1. **Multisig Support**
```rust
pub struct Switch {
    pub owners: Vec<Pubkey>,  // Multiple owners
    pub threshold: u8,         // M-of-N signatures
    // ...
}
```

2. **Privacy Features**
```rust
// Hash-based heartbeat
pub fn send_heartbeat_hash(
    ctx: Context<SendHeartbeat>,
    preimage_hash: [u8; 32]
) -> Result<()> {
    // Verify hash instead of signature
}
```

3. **Emergency Contacts**
```rust
pub struct Switch {
    pub emergency_contacts: Vec<Pubkey>,
    pub emergency_override_delay: i64,
    // ...
}
```

### Medium Priority

4. **Gradual Distribution**
```rust
pub struct VestingSchedule {
    pub intervals: Vec<DistributionInterval>,
}

pub struct DistributionInterval {
    pub delay: i64,      // Seconds after expiry
    pub percentage: u16, // Basis points
}
```

5. **Heartbeat Delegates**
```rust
// Allow trusted delegates to send heartbeats
pub delegates: Vec<Pubkey>,
```

6. **Custom Triggers**
```rust
pub enum ExpiryCondition {
    Timeout,
    OracleCheck { oracle: Pubkey },
    BlockHeight { height: u64 },
}
```

### Low Priority

7. **Recovery Mechanism**
8. **Insurance Pool**
9. **Social Recovery**
10. **Legacy Planning Tools**

## 🔍 Monitoring Recommendations

### Metrics to Track

1. **Program Health**
   - Transaction success rate
   - Compute unit usage
   - Account sizes
   - Failed instruction types

2. **Switch Statistics**
   - Active switches
   - Expired switches
   - Total value locked
   - Distribution success rate

3. **Relayer Performance**
   - Uptime percentage
   - Detection latency
   - Trigger success rate
   - RPC errors

### Alerting

Set up alerts for:
- Relayer downtime > 5 minutes
- Failed triggers > 3 consecutive
- Unusual program errors
- RPC endpoint issues
- Escrow balance anomalies

## 📚 Resources

- [Solana Security Best Practices](https://docs.solana.com/developers)
- [Anchor Security Guide](https://www.anchor-lang.com/docs/security)
- [Sealevel Attack Vectors](https://github.com/coral-xyz/sealevel-attacks)
- [Smart Contract Security Tools](https://github.com/crytic/building-secure-contracts)

## 🤝 Responsible Disclosure

If you discover a security vulnerability:

1. **Do NOT** open a public issue
2. Email security@[your-domain].com
3. Include:
   - Vulnerability description
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
4. Allow 90 days for fix before public disclosure

## ⚖️ Legal Disclaimer

This software is provided "as is" without warranty of any kind. Users assume all risks. Not financial or legal advice. Consult professionals for estate planning.
