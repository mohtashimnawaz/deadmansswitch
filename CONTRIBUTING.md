# Contributing to Dead Man's Switch

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior includes:**
- Trolling, insulting comments, and personal attacks
- Public or private harassment
- Publishing others' private information
- Other conduct deemed inappropriate in a professional setting

## Getting Started

### Prerequisites

Ensure you have installed:
- Node.js 18+
- Rust 1.70+
- Solana CLI 1.18+
- Anchor 0.31+
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/deadmansswitch.git
cd deadmansswitch
```

3. Add upstream remote:
```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/deadmansswitch.git
```

4. Install dependencies:
```bash
yarn install
cd app/relayer && npm install
cd ../web && npm install
```

5. Build the project:
```bash
anchor build
```

## How to Contribute

### Types of Contributions

#### 🐛 Bug Reports
- Use the GitHub issue tracker
- Check if the bug is already reported
- Include:
  - Clear description
  - Steps to reproduce
  - Expected vs actual behavior
  - Environment details
  - Screenshots if applicable

#### ✨ Feature Requests
- Open an issue with "Feature Request" label
- Describe the feature and use case
- Explain why it would be useful
- Consider implementation complexity

#### 📝 Documentation
- Fix typos, clarify explanations
- Add examples and tutorials
- Improve API documentation
- Create diagrams and visuals

#### 💻 Code Contributions
- Bug fixes
- New features
- Performance improvements
- Test coverage
- Refactoring

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/fixes
- `chore/` - Maintenance tasks

### 2. Make Changes

- Write clean, readable code
- Follow existing code style
- Add tests for new features
- Update documentation
- Commit frequently with clear messages

### 3. Commit Guidelines

Use conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
git commit -m "feat(program): add multi-signature support"
git commit -m "fix(relayer): handle RPC connection errors"
git commit -m "docs(readme): update installation instructions"
```

### 4. Keep Your Fork Updated

```bash
git fetch upstream
git rebase upstream/main
```

### 5. Push Changes

```bash
git push origin feature/your-feature-name
```

### 6. Open Pull Request

See [Pull Request Process](#pull-request-process) below.

## Coding Standards

### Rust (Solana Program)

```rust
// Use descriptive variable names
let heartbeat_deadline = clock.unix_timestamp + timeout_seconds;

// Add comments for complex logic
// Calculate proportional share using basis points to avoid rounding errors
let amount = (total as u128)
    .checked_mul(share_bps as u128)
    .unwrap()
    .checked_div(BASIS_POINTS_TOTAL as u128)
    .unwrap() as u64;

// Use Result and ? for error handling
pub fn send_heartbeat(ctx: Context<SendHeartbeat>) -> Result<()> {
    require!(ctx.accounts.switch.status == SwitchStatus::Active, ErrorCode::SwitchNotActive);
    // ...
    Ok(())
}

// Add error codes with descriptions
#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of beneficiaries (1-10 allowed)")]
    InvalidBeneficiaryCount,
}
```

**Run formatter:**
```bash
cd programs/deadmansswitch
cargo fmt
```

### TypeScript (Relayer & Frontend)

```typescript
// Use TypeScript types
interface RelayerConfig {
  rpcUrl: string;
  programId: PublicKey;
  checkInterval: number;
}

// Use async/await
async function checkSwitches(): Promise<void> {
  try {
    const switches = await program.account.switch.all();
    // ...
  } catch (error) {
    logger.error("Error checking switches:", error);
  }
}

// Descriptive function names
private async triggerExpiry(switchPubkey: PublicKey): Promise<boolean> {
  // ...
}
```

**Run linter:**
```bash
npm run lint
```

### General Guidelines

- **Keep functions small** - Single responsibility principle
- **Avoid magic numbers** - Use named constants
- **Error handling** - Handle all error cases
- **Comments** - Explain "why", not "what"
- **DRY** - Don't repeat yourself
- **KISS** - Keep it simple

## Testing Guidelines

### Writing Tests

#### Solana Program Tests

```typescript
describe("new_feature", () => {
  it("should do something correctly", async () => {
    // Arrange
    const input = setupTestData();
    
    // Act
    const tx = await program.methods
      .newInstruction(input)
      .accounts({ /* ... */ })
      .rpc();
    
    // Assert
    const result = await program.account.something.fetch(somePda);
    expect(result.value).to.equal(expectedValue);
  });
  
  it("should fail with invalid input", async () => {
    try {
      await program.methods.newInstruction(invalidInput).rpc();
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).to.include("ExpectedError");
    }
  });
});
```

#### Running Tests

```bash
# All tests
anchor test

# Specific test file
anchor test -- tests/deadmansswitch.ts

# Specific test
anchor test -- --grep "send_heartbeat"

# With logs
RUST_LOG=debug anchor test
```

### Test Coverage Requirements

- **New features**: Must include tests
- **Bug fixes**: Add regression test
- **Refactoring**: Ensure existing tests pass
- **Target**: 80%+ code coverage

## Pull Request Process

### Before Opening PR

- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Code formatted and linted
- [ ] Commit messages follow conventions
- [ ] Branch rebased on latest main

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Tests pass locally
- [ ] Added/updated tests
- [ ] Updated documentation
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** - Must pass CI/CD
2. **Code review** - At least one approval required
3. **Testing** - Reviewer tests changes
4. **Discussion** - Address feedback
5. **Approval** - Maintainer approves
6. **Merge** - Squash and merge to main

### After Merge

- Delete your branch
- Close related issues
- Update documentation if needed

## Project Structure

When contributing, understand the structure:

```
deadmansswitch/
├── programs/          # Solana program (Rust)
├── app/
│   ├── relayer/      # Off-chain keeper (TypeScript)
│   └── web/          # Frontend (Next.js)
├── tests/            # Integration tests
├── scripts/          # Utility scripts
└── docs/             # Documentation
```

## Areas for Contribution

### Good First Issues

Look for issues labeled:
- `good-first-issue`
- `documentation`
- `help-wanted`

### High Priority

- Security improvements
- Test coverage
- Performance optimization
- Bug fixes

### Future Features

- Multi-signature support
- Mobile app
- Email notifications
- Privacy features
- Social recovery

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bugs**: Open a GitHub Issue
- **Chat**: Join Discord (if available)
- **Email**: Contact maintainers

## Recognition

Contributors will be:
- Listed in CHANGELOG
- Mentioned in release notes
- Added to contributors list

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing!** 🎉

Every contribution, no matter how small, helps make this project better.
