# API Reference

## Solana Program API

### Data Structures

#### `Switch`
Main account storing switch state.

```rust
pub struct Switch {
    pub owner: Pubkey,                    // Switch owner's public key
    pub beneficiaries: Vec<Beneficiary>,  // List of beneficiaries
    pub token_type: TokenType,            // SOL or SPL token
    pub timeout_seconds: i64,             // Heartbeat timeout duration
    pub heartbeat_deadline: i64,          // Unix timestamp of deadline
    pub status: SwitchStatus,             // Active/Expired/Canceled
    pub bump: u8,                         // PDA bump seed
}
```

#### `Beneficiary`
Individual beneficiary with share allocation.

```rust
pub struct Beneficiary {
    pub address: Pubkey,     // Beneficiary's public key
    pub share_bps: u16,      // Share in basis points (100 = 1%)
}
```

#### `TokenType`
Type of token held in escrow.

```rust
pub enum TokenType {
    Sol,
    Spl { mint: Pubkey },
}
```

#### `SwitchStatus`
Current state of the switch.

```rust
pub enum SwitchStatus {
    Active,    // Normal operation
    Expired,   // Deadline passed, funds can be distributed
    Canceled,  // Canceled by owner, funds can be withdrawn
}
```

### Instructions

#### `initialize_switch`

Create a new dead man's switch.

**Accounts:**
- `switch` (mut, signer): PDA for switch state
- `escrow` (mut): PDA for holding funds
- `owner` (mut, signer): Switch owner
- `system_program`: System program

**Parameters:**
- `timeout_seconds: i64` - Seconds until expiry (must be > 0)
- `beneficiaries: Vec<Beneficiary>` - 1-10 beneficiaries, shares must sum to 10000
- `token_type: TokenType` - SOL or SPL token

**Errors:**
- `InvalidBeneficiaryCount` - Not between 1-10 beneficiaries
- `InvalidShareDistribution` - Shares don't sum to 10000 basis points
- `InvalidTimeout` - Timeout is not positive

**Example:**
```typescript
const [switchPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("switch"), owner.toBuffer()],
  programId
);
const [escrowPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("escrow"), owner.toBuffer()],
  programId
);

await program.methods
  .initializeSwitch(
    3600, // 1 hour
    [
      { address: beneficiary1, shareBps: 5000 },
      { address: beneficiary2, shareBps: 5000 },
    ],
    { sol: {} }
  )
  .accounts({
    switch: switchPda,
    escrow: escrowPda,
    owner: wallet.publicKey,
  })
  .rpc();
```

---

#### `send_heartbeat`

Reset the deadline by sending a proof of life.

**Accounts:**
- `switch` (mut): Switch PDA
- `owner` (signer): Must be switch owner

**Errors:**
- `SwitchNotActive` - Switch is expired or canceled
- `Unauthorized` - Signer is not the owner

**Example:**
```typescript
await program.methods
  .sendHeartbeat()
  .accounts({
    switch: switchPda,
    owner: wallet.publicKey,
  })
  .rpc();
```

---

#### `trigger_expiry`

Mark switch as expired (can be called by anyone after deadline).

**Accounts:**
- `switch` (mut): Switch PDA

**Errors:**
- `SwitchNotActive` - Already expired or canceled
- `DeadlineNotPassed` - Current time <= deadline

**Example:**
```typescript
await program.methods
  .triggerExpiry()
  .accounts({ switch: switchPda })
  .rpc();
```

---

#### `distribute_sol`

Distribute SOL to one beneficiary.

**Accounts:**
- `switch`: Switch PDA (must be expired)
- `escrow` (mut): Escrow PDA holding SOL
- `beneficiary` (mut): Beneficiary receiving funds
- `system_program`: System program

**Errors:**
- `SwitchNotExpired` - Switch must be expired first
- `InvalidTokenType` - Switch is not SOL type
- `InsufficientFunds` - Escrow is empty
- `BeneficiaryNotFound` - Address not in beneficiary list

**Example:**
```typescript
await program.methods
  .distributeSol()
  .accounts({
    switch: switchPda,
    escrow: escrowPda,
    beneficiary: beneficiaryAddress,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

#### `distribute_spl`

Distribute SPL tokens to one beneficiary.

**Accounts:**
- `switch`: Switch PDA (must be expired)
- `escrow`: Escrow PDA
- `escrow_token_account` (mut): Token account owned by escrow
- `beneficiary`: Beneficiary pubkey
- `beneficiary_token_account` (mut): Beneficiary's token account
- `token_program`: SPL Token program

**Errors:**
- `SwitchNotExpired` - Switch must be expired first
- `InvalidTokenType` - Switch is not SPL type
- `InsufficientFunds` - Token account is empty
- `BeneficiaryNotFound` - Address not in beneficiary list

**Example:**
```typescript
await program.methods
  .distributeSpl()
  .accounts({
    switch: switchPda,
    escrow: escrowPda,
    escrowTokenAccount: escrowTokenAccount,
    beneficiary: beneficiaryAddress,
    beneficiaryTokenAccount: beneficiaryTokenAccount,
    tokenProgram: TOKEN_PROGRAM_ID,
  })
  .rpc();
```

---

#### `cancel_switch`

Cancel the switch (owner only, must be active).

**Accounts:**
- `switch` (mut): Switch PDA
- `owner` (signer): Must be switch owner

**Errors:**
- `SwitchNotActive` - Already expired or canceled
- `Unauthorized` - Signer is not the owner

**Example:**
```typescript
await program.methods
  .cancelSwitch()
  .accounts({
    switch: switchPda,
    owner: wallet.publicKey,
  })
  .rpc();
```

---

#### `withdraw_sol`

Withdraw SOL after cancellation.

**Accounts:**
- `switch`: Switch PDA (must be canceled)
- `escrow` (mut): Escrow PDA
- `owner` (mut, signer): Switch owner
- `system_program`: System program

**Errors:**
- `SwitchNotCanceled` - Must cancel first
- `InsufficientFunds` - Escrow is empty

**Example:**
```typescript
await program.methods
  .withdrawSol()
  .accounts({
    switch: switchPda,
    escrow: escrowPda,
    owner: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();
```

---

## Relayer API

### `DeadManSwitchRelayer`

Main relayer class for monitoring switches.

#### Constructor

```typescript
constructor(config: RelayerConfig)
```

**Config:**
```typescript
interface RelayerConfig {
  rpcUrl: string;           // Solana RPC endpoint
  keypairPath: string;      // Path to relayer wallet
  programId: PublicKey;     // Dead Man's Switch program ID
  checkInterval: number;    // Check frequency in ms
  maxRetries: number;       // Max transaction retries
}
```

#### Methods

##### `start()`
Start the monitoring loop.

```typescript
await relayer.start();
```

##### `stop()`
Stop the monitoring loop.

```typescript
relayer.stop();
```

---

## Frontend Hooks

### `useProgram()`

React hook to get Anchor program instance.

```typescript
const program = useProgram();

if (program) {
  // Program is ready
}
```

Returns: `Program<Deadmansswitch> | null`

---

## Constants

```typescript
MAX_BENEFICIARIES = 10
BASIS_POINTS_TOTAL = 10000  // 100.00%
```

## PDA Derivation

### Switch PDA
```typescript
const [switchPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("switch"), owner.toBuffer()],
  programId
);
```

### Escrow PDA
```typescript
const [escrowPda, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from("escrow"), owner.toBuffer()],
  programId
);
```

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| 6000 | InvalidBeneficiaryCount | Must have 1-10 beneficiaries |
| 6001 | InvalidShareDistribution | Shares must sum to 10000 |
| 6002 | InvalidTimeout | Timeout must be positive |
| 6003 | SwitchNotActive | Switch is not active |
| 6004 | DeadlineNotPassed | Deadline hasn't passed yet |
| 6005 | SwitchNotExpired | Switch hasn't expired |
| 6006 | SwitchNotCanceled | Switch hasn't been canceled |
| 6007 | InvalidTokenType | Wrong token type for operation |
| 6008 | InsufficientFunds | Not enough funds in escrow |
| 6009 | BeneficiaryNotFound | Beneficiary not in list |

## Events

Currently no events are emitted. Consider adding:

```rust
#[event]
pub struct SwitchCreated {
    pub owner: Pubkey,
    pub deadline: i64,
}

#[event]
pub struct HeartbeatReceived {
    pub owner: Pubkey,
    pub new_deadline: i64,
}

#[event]
pub struct SwitchExpired {
    pub owner: Pubkey,
}

#[event]
pub struct FundsDistributed {
    pub beneficiary: Pubkey,
    pub amount: u64,
}
```
