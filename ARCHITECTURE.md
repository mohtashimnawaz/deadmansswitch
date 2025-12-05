# Architecture Diagrams

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           Next.js Frontend (Port 3000)                  │   │
│  │  • Create Switch    • Send Heartbeat    • View Status  │   │
│  └───────────────────────┬─────────────────────────────────┘   │
│                          │                                       │
│                          │ Wallet Adapter                        │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Phantom / Solflare Wallet                  │   │
│  └───────────────────────┬─────────────────────────────────┘   │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           │ RPC Calls (HTTPS)
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│                      SOLANA BLOCKCHAIN                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Dead Man's Switch Program                    │   │
│  │              (BPF Executable)                          │   │
│  │                                                         │   │
│  │  Instructions:                                          │   │
│  │  • initialize_switch                                    │   │
│  │  • send_heartbeat                                       │   │
│  │  • trigger_expiry                                       │   │
│  │  • distribute_sol / distribute_spl                     │   │
│  │  • cancel_switch                                        │   │
│  │                                                         │   │
│  └──────────┬──────────────────────────────────────────────┘   │
│             │                                                   │
│             │ Manages                                           │
│             ▼                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Program Accounts                          │   │
│  │                                                         │   │
│  │  Switch PDA:                                            │   │
│  │  • owner: Pubkey                                        │   │
│  │  • beneficiaries: Vec<Beneficiary>                     │   │
│  │  • heartbeat_deadline: i64                              │   │
│  │  • status: Active/Expired/Canceled                      │   │
│  │                                                         │   │
│  │  Escrow PDA:                                            │   │
│  │  • Holds SOL / SPL tokens                              │   │
│  │  • Controlled by program                                │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                          ▲                                      │
└──────────────────────────┼─────────────────────────────────────┘
                           │
                           │ Monitors & Triggers
                           │ (RPC Polling)
┌──────────────────────────┴─────────────────────────────────────┐
│                    OFF-CHAIN SERVICES                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │          Relayer/Keeper (Node.js)                       │   │
│  │                                                         │   │
│  │  Loop (every 60s):                                      │   │
│  │  1. Fetch all active switches                          │   │
│  │  2. Check if deadline passed                            │   │
│  │  3. Call trigger_expiry()                              │   │
│  │  4. Call distribute_sol() for each beneficiary         │   │
│  │                                                         │   │
│  │  Logging:                                               │   │
│  │  • Winston logger                                       │   │
│  │  • Error tracking                                       │   │
│  │  • Metrics collection                                   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## User Flow: Creating a Switch

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Connect Wallet
     ▼
┌─────────────────┐
│   Frontend      │
└────┬────────────┘
     │
     │ 2. Fill Form:
     │    - Timeout: 86400s (24h)
     │    - Beneficiary 1: 60%
     │    - Beneficiary 2: 40%
     ▼
┌─────────────────┐
│ Wallet Adapter  │ ◄─── User Approves Transaction
└────┬────────────┘
     │
     │ 3. Send Transaction
     ▼
┌─────────────────────────────┐
│   Solana Validator          │
└────┬────────────────────────┘
     │
     │ 4. Execute initialize_switch
     ▼
┌─────────────────────────────┐
│  Program Creates:           │
│  • Switch PDA               │
│  • Escrow PDA               │
│  • Sets deadline            │
│  • Stores beneficiaries     │
└────┬────────────────────────┘
     │
     │ 5. Transaction Success
     ▼
┌─────────────────┐
│   Frontend      │ ──► Shows confirmation
└─────────────────┘
```

## User Flow: Sending Heartbeat

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Click "I'm Alive!" button
     ▼
┌─────────────────┐
│   Frontend      │
└────┬────────────┘
     │
     │ 2. Call send_heartbeat()
     ▼
┌─────────────────────────────┐
│   Solana Program            │
└────┬────────────────────────┘
     │
     │ 3. Verify owner signature
     │ 4. Update deadline:
     │    new_deadline = now + timeout
     ▼
┌─────────────────────────────┐
│  Switch PDA Updated         │
│  heartbeat_deadline: NEW    │
└────┬────────────────────────┘
     │
     │ 5. Success
     ▼
┌─────────────────┐
│   Frontend      │ ──► Shows new deadline
└─────────────────┘
```

## Automatic Expiry & Distribution

```
┌──────────────────┐
│ Time Passes...   │
│ Deadline reached │
└────┬─────────────┘
     │
     ▼
┌─────────────────────────────┐
│   Relayer (monitoring)      │
└────┬────────────────────────┘
     │
     │ 1. Detects expired switch
     │    (now > heartbeat_deadline)
     ▼
┌─────────────────────────────┐
│  Call trigger_expiry()      │
└────┬────────────────────────┘
     │
     │ 2. Program updates status
     ▼
┌─────────────────────────────┐
│  Switch Status: EXPIRED     │
└────┬────────────────────────┘
     │
     │ 3. Relayer loops through beneficiaries
     ▼
┌─────────────────────────────────────┐
│ For each beneficiary:               │
│                                     │
│ Call distribute_sol(beneficiary)    │
│                                     │
│ Program calculates:                 │
│ amount = escrow × (share_bps/10000) │
│                                     │
│ Transfer from Escrow PDA            │
│         to Beneficiary              │
└─────────┬───────────────────────────┘
          │
          ▼
    ┌─────────────┐
    │ Beneficiary │ ──► Receives funds!
    │   Wallet    │
    └─────────────┘
```

## Data Structure Relationships

```
┌─────────────────────────────────────┐
│           Switch Account            │
│  (PDA: ["switch", owner_pubkey])    │
├─────────────────────────────────────┤
│ owner: Pubkey                       │──────┐
│ timeout_seconds: 86400              │      │
│ heartbeat_deadline: 1234567890      │      │
│ status: Active                      │      │
│ token_type: Sol                     │      │
│ beneficiaries: [                    │      │
│   { addr: Ben1, share: 6000 },     │──┐   │
│   { addr: Ben2, share: 4000 }      │  │   │
│ ]                                   │  │   │
│ bump: 254                           │  │   │
└─────────────────────────────────────┘  │   │
                                         │   │
                                         │   │ Controls
┌────────────────────────────────────┐   │   │
│        Escrow Account              │   │   │
│  (PDA: ["escrow", owner_pubkey])   │◄──┘   │
├────────────────────────────────────┤       │
│ lamports: 500_000_000 (0.5 SOL)    │       │
│ owner: Program                     │       │
└────────────────────────────────────┘       │
                                             │
                                             │ Owns
┌────────────────────────────────────┐       │
│        Owner Wallet                │◄──────┘
├────────────────────────────────────┤
│ Can:                               │
│ • Send heartbeat                   │
│ • Cancel switch                    │
│ • Withdraw (if canceled)           │
└────────────────────────────────────┘

         │ On expiry, distributes to:
         ▼
┌──────────────────────┐    ┌──────────────────────┐
│  Beneficiary 1       │    │  Beneficiary 2       │
│  Gets 60% (300 ms)   │    │  Gets 40% (200 ms)   │
└──────────────────────┘    └──────────────────────┘
```

## State Machine

```
                   ┌──────────────────┐
                   │   [Initialize]   │
                   └────────┬─────────┘
                            │
                            ▼
                   ┌──────────────────┐
              ┌───►│     ACTIVE       │◄───┐
              │    └────────┬─────────┘    │
              │             │               │
              │             │               │
[send_heartbeat]      [trigger_expiry]   [Owner can cancel]
              │             │               │
              │             ▼               │
              │    ┌──────────────────┐    │
              │    │    EXPIRED       │    │
              │    │                  │    │
              │    │  [distribute_*]  │    │
              │    │  (each ben.)     │    │
              │    └──────────────────┘    │
              │                             │
              └──────────┐                  │
                         │                  │
                         ▼                  ▼
                ┌──────────────────┐  ┌──────────────────┐
                │    CANCELED      │◄─┘ [cancel_switch]  │
                │                  │                      │
                │  [withdraw_sol]  │                      │
                └──────────────────┘                      │
                         │                                │
                         ▼                                │
                   Funds returned                         │
                   to owner                               │
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                       DEVNET / MAINNET                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Dead Man's Switch Program               │   │
│  │         Program ID: BUE3Lb...                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
           ▲                                  ▲
           │                                  │
           │ RPC                              │ RPC
           │                                  │
┌──────────┴─────────────┐       ┌───────────┴──────────┐
│   Vercel / Netlify     │       │   Render / Railway    │
│   (Frontend Hosting)   │       │   (Relayer Hosting)   │
├────────────────────────┤       ├──────────────────────┤
│  Next.js Web App       │       │  Node.js Relayer     │
│  • Static build        │       │  • 24/7 uptime       │
│  • CDN distribution    │       │  • Auto-restart      │
│  • Wallet connection   │       │  • Logging           │
└────────────────────────┘       └──────────────────────┘
           ▲
           │
           │ HTTPS
           │
    ┌──────┴──────┐
    │    Users    │
    │   (Wallets) │
    └─────────────┘
```

## Security Model

```
┌─────────────────────────────────────────────────────┐
│                  Security Layers                    │
└─────────────────────────────────────────────────────┘

Layer 1: Blockchain Level
┌───────────────────────────────────────────────────┐
│ • Transaction signatures required                 │
│ • Account ownership verified                      │
│ • No external calls (no reentrancy)              │
└───────────────────────────────────────────────────┘

Layer 2: Program Level
┌───────────────────────────────────────────────────┐
│ • PDA-based escrow (no private keys)              │
│ • Owner-only operations enforced                  │
│ • Input validation (shares, timeout, etc.)        │
│ • Status flags prevent double-spending            │
└───────────────────────────────────────────────────┘

Layer 3: Account Constraints
┌───────────────────────────────────────────────────┐
│ • #[account(has_one = owner)]                     │
│ • #[account(seeds = [...], bump)]                 │
│ • Signer requirements                             │
└───────────────────────────────────────────────────┘

Layer 4: Application Level
┌───────────────────────────────────────────────────┐
│ • Wallet approval required                        │
│ • Frontend validation                             │
│ • Error handling and retries                      │
└───────────────────────────────────────────────────┘
```

---

## Legend

```
┌─────┐
│ Box │  = Component / System
└─────┘

  │
  │     = Data flow / Relationship
  ▼

◄────►  = Bi-directional communication

PDA     = Program Derived Address
RPC     = Remote Procedure Call
ms      = Milliseconds (lamports)
```
