# AGENTS.md — openclaw/packages

Bot implementation packages. Standalone chatbot gateways built on OpenClaw infrastructure.

## STRUCTURE

```
packages/
├── clawdbot/         # ClawdMatrix-enhanced chatbot gateway
└── moltbot/          # Alternative bot implementation
```

Each package is a self-contained npm package with its own `package.json`, dependencies, and entry point.

## WHERE TO LOOK

| Task             | Package         | Notes                                            |
| ---------------- | --------------- | ------------------------------------------------ |
| ClawdMatrix bot  | clawdbot/       | Multi-stage cognition pipeline, enhanced gateway |
| Alternative bot  | moltbot/        | Separate bot implementation                      |
| Bot dependencies | \*/package.json | Each bot manages its own deps                    |
| Bot entry points | \*/index.js     | Main execution entry                             |

## CONVENTIONS

**Package structure**:

- Each bot is an independent npm package
- Own `package.json` with dependencies
- Entry point typically `index.js`
- May include `scripts/` for bot-specific tooling

**Dependencies**:

- Bots manage their own dependency trees
- May depend on core `openclaw` or extensions
- Keep bot-specific deps isolated to bot package

**Testing**:

- Bot-specific tests live in bot directory
- Run via root `pnpm test` (workspace-aware)

## ANTI-PATTERNS

- Do NOT add bot-only deps to root `package.json`
- Do NOT share state between bot packages (keep isolated)
- Do NOT skip error handling in bot message loops
