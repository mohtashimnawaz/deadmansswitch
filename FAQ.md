# Frequently Asked Questions (FAQ)

## General Questions

### What is a Dead Man's Switch?

A dead man's switch is a mechanism that automatically triggers an action if the operator becomes incapacitated or stops checking in. In this implementation, it automatically distributes your crypto assets to beneficiaries if you stop sending "heartbeat" messages.

### How does it work?

1. You create a switch and specify beneficiaries
2. You deposit funds into an escrow
3. You send regular "heartbeats" to prove you're alive
4. If you stop sending heartbeats and the deadline passes, funds automatically distribute to your beneficiaries

### Is it safe?

Yes, when used correctly:
- Funds are held in program-owned accounts (PDAs) that no one can access directly
- Only you can send heartbeats or cancel the switch
- All code is open-source and auditable
- Distribution only happens to pre-approved beneficiaries

However, **use at your own risk** and start with small amounts.

### What happens to my funds?

Your funds are held in a Program Derived Address (PDA) - a special account controlled by the smart contract. No one, including the developers, can access these funds except through the programmed rules.

## Usage Questions

### How do I create a switch?

1. Connect your wallet to the web app
2. Click "Create Switch"
3. Set timeout (e.g., 24 hours)
4. Add beneficiaries and their share percentages
5. Approve the transaction
6. Send funds to the escrow address

### How often should I send heartbeats?

It depends on your timeout setting:
- **Timeout = 24 hours**: Send daily heartbeats
- **Timeout = 7 days**: Send weekly heartbeats
- **Timeout = 30 days**: Send monthly heartbeats

**Recommendation**: Send heartbeats at half the timeout interval for safety margin.

### What if I forget to send a heartbeat?

If the deadline passes:
1. The relayer will detect the expiry
2. Your switch status changes to "Expired"
3. Funds are distributed to beneficiaries
4. You **cannot** reverse this after expiry

**Prevention**: Set calendar reminders!

### Can I change beneficiaries?

Not directly. You must:
1. Cancel the existing switch
2. Withdraw funds
3. Create a new switch with updated beneficiaries

### Can I add more funds to existing switch?

Yes, simply send SOL or tokens to the escrow PDA address. The distribution will include all funds in the escrow.

### How do I cancel my switch?

1. Go to the web app
2. Click "Cancel Switch"
3. Approve transaction
4. Call "Withdraw" to get your funds back

**Note**: You can only cancel while status is "Active".

### What if I lose access to my wallet?

Unfortunately, without your wallet private key, you cannot:
- Send heartbeats
- Cancel the switch
- Withdraw funds

This is why it's critical to:
- Back up your seed phrase securely
- Consider using hardware wallets
- Set reasonable timeouts

## Technical Questions

### What networks are supported?

Currently:
- Localnet (development)
- Devnet (testing)
- Mainnet-beta (production, after audit)

### What tokens are supported?

- **SOL**: Native Solana token (fully implemented)
- **SPL Tokens**: Any SPL token (implementation ready, needs testing)

### How much does it cost?

**One-time costs**:
- Switch creation: ~0.01 SOL (rent + transaction fee)
- Each heartbeat: ~0.000005 SOL (transaction fee)
- Distribution: ~0.000005 SOL per beneficiary

**Ongoing costs**:
- Escrow rent: ~0.002 SOL (refundable when closed)

### How fast is distribution after expiry?

Depends on relayer check interval:
- Default: 60 seconds
- Could be minutes to hours if relayer is slow
- Anyone can trigger expiry (not just relayer)

### Can someone steal my funds?

**No**, if the program is working correctly:
- Funds are in PDAs with no private keys
- Only the program can move funds
- Program only allows distribution to beneficiaries or withdrawal to owner (if canceled)

**However**, risks exist:
- Bug in program code (why audits are important)
- Malicious program upgrade (use immutable programs)
- Wrong beneficiary address entered (double-check!)

### What if the relayer goes down?

The relayer is just a convenience service. If it goes down:
- Your switch still works
- Anyone can call `trigger_expiry` after deadline
- Beneficiaries can trigger it themselves
- You can run your own relayer

### Can I run my own relayer?

Yes! See `app/relayer/README.md` for instructions:

```bash
cd app/relayer
npm install
cp .env.example .env
# Edit .env with your settings
npm start
```

## Beneficiary Questions

### How do beneficiaries claim funds?

After expiry:
1. Relayer automatically calls `distribute_sol` for each beneficiary
2. Funds are sent directly to beneficiary wallets
3. No action needed from beneficiaries

If relayer fails, beneficiaries can:
1. Call `trigger_expiry` on the switch
2. Call `distribute_sol` with their address

### Do beneficiaries know they're listed?

Not automatically. You should:
- Inform beneficiaries about the switch
- Share your switch address
- Explain how it works
- Provide documentation

### Can beneficiaries refuse the funds?

Once distributed, funds are in their wallet. They could technically send them back, but there's no built-in refuse mechanism.

### What if a beneficiary's address is wrong?

If you mistype an address:
- Funds will go to that address (possibly no one)
- You cannot recover them after expiry
- **Always double-check addresses!**

**Best practice**: Send a small test amount first.

## Advanced Questions

### Can I use multiple switches?

Currently, one switch per wallet address. To have multiple:
- Use multiple wallets
- Or use subwallets/derived keys

Future versions may support multiple switches per wallet.

### Can I have different switches for different assets?

Not directly from one wallet. You need:
- Separate switch for SOL
- Separate switch for each SPL token
- Use different wallets for each

### What about NFTs?

NFTs are SPL tokens, so technically supported. However:
- Each NFT needs individual distribution call
- May be expensive for large collections
- Better suited for fungible tokens

### Can I automate heartbeats?

Technically yes, but **not recommended**:
- Defeats the purpose (prove YOU'RE alive)
- If automation fails, you might not notice
- Ethical concerns

If you must:
- Use cron job to call heartbeat
- Set up monitoring/alerts
- Have backup plan

### Can I integrate this into my app?

Yes! The program is open-source:
- Use the Anchor IDL
- Follow API documentation (API.md)
- Reference the frontend implementation
- Submit PRs for improvements

### What's the maximum timeout?

**Technical limit**: ~292 billion years (i64 max seconds)

**Practical limits**:
- Minimum: 1 second (configurable)
- Maximum: Whatever makes sense (months to years)
- Recommended: 7-90 days

### Can I get notified before expiry?

Not built-in yet. Future features may include:
- Email notifications
- SMS alerts
- Mobile push notifications
- Discord/Telegram bots

For now, use external calendar reminders.

## Troubleshooting

### "Switch not found" error

Possible causes:
- Using wrong wallet
- Switch not created yet
- Wrong network (devnet vs mainnet)
- Program not deployed

### "Insufficient funds" error

You need SOL for:
- Transaction fees (~0.000005 SOL)
- Account rent (~0.01 SOL for switch creation)

Solution: Airdrop more SOL (devnet) or buy SOL (mainnet)

### "Deadline not passed" error

You're trying to trigger expiry too early. Wait until:
```
Current time > heartbeat_deadline
```

Check your switch status to see time remaining.

### Heartbeat transaction fails

Possible causes:
- Not the switch owner
- Switch is expired or canceled
- Network issues
- Insufficient SOL for fees

### Distribution fails

Possible causes:
- Switch not expired yet
- Beneficiary address invalid
- No funds in escrow
- Wrong token type

## Security Questions

### Is this audited?

**Not yet**. This is v1.0.0 and should be audited before mainnet deployment.

**Until audited**:
- Use only on devnet
- Test with small amounts
- Consider it experimental

### What if there's a bug?

If you find a bug:
1. **Don't** exploit it
2. Report it privately to security@[domain]
3. Allow time for fix
4. Responsible disclosure

See SECURITY.md for details.

### Can the program be upgraded?

Yes, if upgrade authority is set. To prevent malicious upgrades:
- Make program immutable (`--final`)
- Use multisig upgrade authority
- Add timelock for upgrades

### What about privacy?

**All data is public** on Solana blockchain:
- Beneficiary addresses visible
- Timeout visible
- Fund amounts visible
- Heartbeat times visible

For privacy, future versions could use:
- Encrypted beneficiary data
- Hash-based heartbeats
- Zero-knowledge proofs

## Business/Legal Questions

### Is this legal advice?

**No.** This is software, not legal or financial advice. Consult:
- Estate planning attorney
- Tax professional
- Legal counsel

### Does this replace a will?

**No.** This is a technical tool. It does not:
- Replace legal wills
- Handle all asset types
- Consider tax implications
- Provide legal protections

Use as part of broader estate planning.

### What about taxes?

Tax implications vary by jurisdiction. Consult a tax professional about:
- Gift taxes
- Estate taxes
- Capital gains
- Inheritance taxes

### Can this be used for business?

Potentially, for:
- Business continuity
- Partner agreements
- Emergency access
- Fund management

But consult legal counsel first.

## Support

### Where can I get help?

- **Documentation**: Read docs in this repo
- **Issues**: GitHub Issues for bugs
- **Discussions**: GitHub Discussions for questions
- **Email**: Contact maintainers
- **Community**: Discord (if available)

### How can I contribute?

See CONTRIBUTING.md for guidelines. All contributions welcome:
- Code improvements
- Bug fixes
- Documentation
- Testing
- Design
- Ideas

### Who maintains this?

See PROJECT_SUMMARY.md for project information and CONTRIBUTING.md for maintainer contact.

---

## Didn't find your answer?

Open a [GitHub Discussion](https://github.com/yourrepo/discussions) or [GitHub Issue](https://github.com/yourrepo/issues).
