# Changelog

All notable changes to the Dead Man's Switch project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Mobile app for heartbeats
- Email notifications
- Multi-signature support
- Privacy features (hash-based heartbeats)
- Gradual distribution/vesting schedules
- Emergency contact system
- Oracle integration for custom triggers
- Social recovery mechanism
- Insurance pool

## [1.0.0] - 2025-12-06

### Added - Initial Release

#### Solana Program
- `initialize_switch` instruction for creating dead man's switches
- `send_heartbeat` instruction for extending deadline
- `trigger_expiry` instruction for marking switches as expired
- `distribute_sol` instruction for distributing SOL to beneficiaries
- `distribute_spl` instruction for distributing SPL tokens
- `cancel_switch` instruction for canceling active switches
- `withdraw_sol` instruction for withdrawing funds after cancellation
- PDA-based escrow system for secure fund storage
- Support for up to 10 beneficiaries per switch
- Basis point system for precise percentage-based distribution
- Status state machine (Active, Expired, Canceled)
- Comprehensive error handling with custom error codes
- Input validation for all instructions

#### Relayer/Keeper Service
- Automatic monitoring of all active switches
- Configurable check interval (default: 60 seconds)
- Automatic expiry triggering when deadline passes
- Automatic fund distribution to all beneficiaries
- Retry logic with exponential backoff
- Winston-based logging system
- Environment-based configuration
- Error tracking and reporting

#### Frontend Web Application
- Next.js 14 with App Router
- Solana Wallet Adapter integration (Phantom, Solflare)
- Switch creation interface with beneficiary management
- Heartbeat sending interface
- Switch status viewer with real-time countdown
- Responsive design with Tailwind CSS
- Custom React hooks for program interaction
- Form validation and error handling
- Loading states and user feedback

#### Testing
- Comprehensive integration tests for all instructions
- Test coverage for:
  - Switch initialization with various scenarios
  - Heartbeat functionality
  - Expiry triggering
  - SOL distribution with multiple beneficiaries
  - Cancellation workflow
  - Error cases and edge conditions
- Chai assertion library integration
- Mocha test runner

#### Documentation
- README.md with quick start guide
- DEVELOPMENT.md with developer workflow
- API.md with complete API reference
- DEPLOYMENT.md with deployment checklist
- SECURITY.md with security considerations
- ARCHITECTURE.md with visual diagrams
- PROJECT_SUMMARY.md with project overview

#### Scripts & Utilities
- `scripts/start.sh` - One-command local setup
- `scripts/stop.sh` - Stop all services
- Package.json scripts for common tasks

#### Configuration
- Anchor.toml for program configuration
- TypeScript configurations for all TypeScript projects
- Next.js configuration with Solana optimizations
- Tailwind CSS and PostCSS setup
- Environment variable templates

### Security Features
- PDA-based non-custodial escrow
- Owner-only operation enforcement
- Re-entrancy protection via status flags
- Arithmetic overflow protection
- Comprehensive input validation
- Beneficiary verification
- Share distribution validation (must sum to 100%)

### Developer Experience
- Hot reload for all components
- Comprehensive error messages
- Detailed logging
- Type safety throughout
- Code comments and documentation
- Example configurations

## Version History

### Versioning Scheme
- **Major** (1.x.x): Breaking changes, major features
- **Minor** (x.1.x): New features, backwards compatible
- **Patch** (x.x.1): Bug fixes, minor improvements

### Release Notes Template

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed

### Removed
- Removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

## Future Roadmap

### v1.1.0 (Planned)
- [ ] Event emission for all state changes
- [ ] Improved SPL token support with auto-created ATAs
- [ ] Frontend improvements (better error messages, tooltips)
- [ ] Relayer dashboard for monitoring
- [ ] Email notifications via relayer

### v1.2.0 (Planned)
- [ ] Multi-signature support
- [ ] Emergency contacts feature
- [ ] Heartbeat delegation
- [ ] Custom triggers (oracle-based, block height)

### v2.0.0 (Planned - Breaking Changes)
- [ ] Privacy features (hash-based heartbeats)
- [ ] Gradual distribution/vesting
- [ ] Social recovery mechanism
- [ ] Complete program redesign for gas efficiency

### v3.0.0 (Future Vision)
- [ ] Mobile apps (iOS/Android)
- [ ] Cross-chain support
- [ ] AI-powered features
- [ ] Insurance pool integration

## Migration Guides

### Upgrading from Pre-Release to v1.0.0

Since this is the initial release, no migration is needed.

Future migrations will include:
- Program upgrade instructions
- Data migration scripts
- Configuration changes
- Breaking API changes

## Deprecation Policy

Features will be deprecated with at least:
- 1 minor version warning for minor breaking changes
- 1 major version warning for major breaking changes
- 90 days notice for critical infrastructure changes

## Support

For questions about specific versions:
- Check the documentation for that version
- Review closed issues on GitHub
- Ask in community channels

---

**Last Updated**: December 6, 2025
**Current Stable Version**: v1.0.0
**Status**: Production Ready (after audit)
