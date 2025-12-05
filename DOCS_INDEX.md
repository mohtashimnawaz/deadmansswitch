# 📚 Documentation Index

Welcome to the Dead Man's Switch documentation! This index will help you find the information you need.

## 🚀 Getting Started

Start here if you're new to the project:

1. **[README.md](README.md)** - Project overview and quick start
2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What has been built
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture with diagrams

## 📖 Core Documentation

### For Users

- **[README.md](README.md)** - Installation and usage instructions
- **[FAQ.md](FAQ.md)** - Frequently asked questions
- **[SECURITY.md](SECURITY.md)** - Security considerations and best practices

### For Developers

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Development workflow and best practices
- **[API.md](API.md)** - Complete API reference
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and changes

### For Deployers

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment checklist and procedures
- **[SECURITY.md](SECURITY.md)** - Security audit checklist

## 📁 Component Documentation

### Solana Program
- Location: `programs/deadmansswitch/src/lib.rs`
- Documentation: [API.md](API.md) - Instructions section
- Tests: `tests/deadmansswitch.ts`

### Relayer/Keeper
- Location: `app/relayer/`
- Documentation: `app/relayer/README.md`
- Configuration: `app/relayer/.env.example`

### Frontend Web App
- Location: `app/web/`
- Documentation: `app/web/README.md`
- Configuration: `app/web/next.config.mjs`

## 🎯 Quick Reference

### Common Tasks

| Task | Documentation | Command |
|------|---------------|---------|
| Install dependencies | [README.md](README.md) | `yarn install` |
| Build program | [README.md](README.md) | `anchor build` |
| Run tests | [DEVELOPMENT.md](DEVELOPMENT.md) | `anchor test` |
| Start locally | [README.md](README.md) | `yarn start` |
| Deploy to devnet | [DEPLOYMENT.md](DEPLOYMENT.md) | `anchor deploy` |
| Start relayer | `app/relayer/README.md` | `npm run dev` |
| Start frontend | `app/web/README.md` | `npm run dev` |

### Find Information About...

| Topic | Document |
|-------|----------|
| **What is this project?** | [README.md](README.md), [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |
| **How does it work?** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **How to install?** | [README.md](README.md) |
| **How to use?** | [README.md](README.md), [FAQ.md](FAQ.md) |
| **How to develop?** | [DEVELOPMENT.md](DEVELOPMENT.md) |
| **API reference?** | [API.md](API.md) |
| **How to deploy?** | [DEPLOYMENT.md](DEPLOYMENT.md) |
| **How to contribute?** | [CONTRIBUTING.md](CONTRIBUTING.md) |
| **Is it secure?** | [SECURITY.md](SECURITY.md) |
| **Troubleshooting?** | [FAQ.md](FAQ.md) |
| **What changed?** | [CHANGELOG.md](CHANGELOG.md) |

## 📋 Checklists

### For First-Time Users
- [ ] Read [README.md](README.md)
- [ ] Read [FAQ.md](FAQ.md)
- [ ] Read [SECURITY.md](SECURITY.md)
- [ ] Test on devnet with small amounts
- [ ] Understand the risks

### For Developers
- [ ] Read [README.md](README.md)
- [ ] Read [DEVELOPMENT.md](DEVELOPMENT.md)
- [ ] Read [API.md](API.md)
- [ ] Set up development environment
- [ ] Run tests successfully
- [ ] Read [CONTRIBUTING.md](CONTRIBUTING.md)

### For Deployers
- [ ] Read [DEPLOYMENT.md](DEPLOYMENT.md)
- [ ] Read [SECURITY.md](SECURITY.md)
- [ ] Complete security audit
- [ ] Test thoroughly on devnet
- [ ] Set up monitoring
- [ ] Follow deployment checklist

## 🔍 Documentation by Role

### I'm a User
1. Start: [README.md](README.md) - Overview
2. Learn: [FAQ.md](FAQ.md) - Common questions
3. Stay safe: [SECURITY.md](SECURITY.md) - Best practices

### I'm a Developer
1. Start: [README.md](README.md) - Quick start
2. Setup: [DEVELOPMENT.md](DEVELOPMENT.md) - Dev workflow
3. Reference: [API.md](API.md) - API docs
4. Contribute: [CONTRIBUTING.md](CONTRIBUTING.md) - Guidelines
5. Architecture: [ARCHITECTURE.md](ARCHITECTURE.md) - System design

### I'm an Auditor
1. Overview: [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - What's built
2. Security: [SECURITY.md](SECURITY.md) - Security model
3. Code: `programs/deadmansswitch/src/lib.rs` - Source
4. Tests: `tests/deadmansswitch.ts` - Test coverage
5. Architecture: [ARCHITECTURE.md](ARCHITECTURE.md) - Design

### I'm a DevOps Engineer
1. Deploy: [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
2. Monitor: [SECURITY.md](SECURITY.md) - Monitoring section
3. Relayer: `app/relayer/README.md` - Service setup
4. Security: [SECURITY.md](SECURITY.md) - Operations

## 📚 Document Descriptions

### [README.md](README.md)
**Main documentation** covering:
- Project description
- Architecture overview
- Quick start guide
- Installation instructions
- Usage examples
- Deployment basics

**Read this first!**

### [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
**Project overview** including:
- What has been built
- Architecture summary
- Project statistics
- Next steps
- Status

**Great for understanding scope.**

### [ARCHITECTURE.md](ARCHITECTURE.md)
**System design** with:
- Component diagrams
- Data flow diagrams
- State machine diagrams
- Deployment architecture
- Security model

**Visual learners, start here!**

### [API.md](API.md)
**Complete API reference** for:
- All program instructions
- Account structures
- Error codes
- TypeScript examples
- PDA derivations

**Essential for developers.**

### [DEVELOPMENT.md](DEVELOPMENT.md)
**Developer guide** covering:
- Project structure
- Development workflow
- Common tasks
- Debugging tips
- Best practices

**Your dev handbook.**

### [DEPLOYMENT.md](DEPLOYMENT.md)
**Deployment procedures** including:
- Pre-deployment checklist
- Devnet deployment
- Mainnet deployment
- Service configuration
- Monitoring setup

**Critical for deployments.**

### [SECURITY.md](SECURITY.md)
**Security documentation** addressing:
- Current security features
- Potential vulnerabilities
- Best practices for users
- Audit checklist
- Incident response

**Read before mainnet!**

### [FAQ.md](FAQ.md)
**Common questions** about:
- How it works
- Usage instructions
- Troubleshooting
- Technical details
- Legal considerations

**Check here first for questions.**

### [CONTRIBUTING.md](CONTRIBUTING.md)
**Contribution guide** with:
- Code of conduct
- Getting started
- Development workflow
- Coding standards
- Pull request process

**Want to contribute? Start here.**

### [CHANGELOG.md](CHANGELOG.md)
**Version history** including:
- Release notes
- Feature additions
- Bug fixes
- Breaking changes
- Migration guides

**Track project evolution.**

### [LICENSE](LICENSE)
**MIT License** - Legal terms for use and distribution

## 🎓 Learning Paths

### Path 1: User
```
README.md → FAQ.md → SECURITY.md → Create your switch!
```

### Path 2: Developer
```
README.md → DEVELOPMENT.md → API.md → ARCHITECTURE.md → Start coding!
```

### Path 3: Contributor
```
README.md → DEVELOPMENT.md → CONTRIBUTING.md → Find an issue → Submit PR!
```

### Path 4: DevOps
```
README.md → ARCHITECTURE.md → DEPLOYMENT.md → SECURITY.md → Deploy!
```

### Path 5: Security Researcher
```
PROJECT_SUMMARY.md → SECURITY.md → ARCHITECTURE.md → Source code → Report findings!
```

## 📞 Need Help?

Can't find what you're looking for?

1. **Check [FAQ.md](FAQ.md)** - Most common questions answered
2. **Search issues** - Maybe someone asked already
3. **Open discussion** - Ask the community
4. **Open issue** - Report bugs
5. **Contact maintainers** - For sensitive matters

## 🔄 Documentation Updates

This documentation is actively maintained. Last updated: **December 6, 2025**

Found an error or want to improve docs?
- See [CONTRIBUTING.md](CONTRIBUTING.md)
- Open a PR with `docs/` prefix

## ⭐ Quick Tips

- 📖 **New to project?** Start with [README.md](README.md)
- 🎯 **Need quick answer?** Check [FAQ.md](FAQ.md)
- 💻 **Ready to code?** Read [DEVELOPMENT.md](DEVELOPMENT.md)
- 🚀 **Deploying?** Follow [DEPLOYMENT.md](DEPLOYMENT.md)
- 🔒 **Security concern?** Review [SECURITY.md](SECURITY.md)
- 📊 **Want overview?** See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)

---

**Happy building! 🎉**
