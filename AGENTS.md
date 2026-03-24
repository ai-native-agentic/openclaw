# AGENTS.md — openclaw

**Branch:** main @ 6ba4d0ddc  
**Generated:** 2026-03-17

Multi-channel AI gateway with 22+ messaging channels, 42 extensions, and dynamic plugin architecture. TypeScript pnpm monorepo optimized for extensibility and production deployment.

## OVERVIEW

openclaw is a production-grade multi-channel AI gateway that routes conversations across 22+ messaging platforms (Telegram, Discord, WhatsApp, Slack, Signal, iMessage, IRC, Matrix, etc.) with 42 npm workspace extensions providing providers, tools, and integrations. The architecture uses dynamic plugin loading via jiti, self-registering channels, and a WebSocket gateway server (port 18789) for real-time coordination. Core runtime is Node.js 22+ with Bun support for dev/test workflows.

**Key capabilities:**

- 22+ built-in messaging channels with self-registration pattern
- 42 workspace extensions (providers, channels, tools, memory backends)
- Dynamic plugin loading via jiti (no restart required)
- WebSocket gateway server with HTTP webhook support
- Plugin SDK with 30+ exported modules for third-party extensions
- Encrypted credential storage at `~/.openclaw/credentials/`
- JSONL session logs at `~/.openclaw/sessions/`
- Vitest test suite with 70% coverage threshold (V8)

**Tech stack:** TypeScript ESM, pnpm workspaces, oxlint/oxfmt, Vitest, Node 22+, Bun (dev), WebSocket, jiti dynamic imports

## STRUCTURE

```
openclaw/
├── src/
│   ├── entry.ts                    # CLI entrypoint with respawn logic (221 lines)
│   ├── cli/                        # CLI wiring (argv, profile, respawn policy)
│   ├── commands/                   # Command implementations
│   ├── gateway/
│   │   └── server.ts               # WebSocket gateway (249 modules, port 18789)
│   ├── channels/
│   │   └── registry.ts             # Channel metadata + self-registration (200 lines)
│   ├── providers/                  # Provider helpers (GitHub Copilot, Google, Qwen OAuth)
│   ├── plugin-sdk/                 # Plugin SDK (core, compat, routing, sandbox, provider-setup)
│   ├── telegram/                   # Core Telegram channel
│   ├── discord/                    # Core Discord channel
│   ├── slack/                      # Core Slack channel
│   ├── signal/                     # Core Signal channel
│   ├── imessage/                   # Core iMessage channel
│   ├── web/                        # WhatsApp Web channel
│   ├── routing/                    # Message routing logic
│   ├── infra/                      # Infrastructure (env, gaxios compat, process markers)
│   ├── media/                      # Media pipeline
│   └── terminal/                   # Terminal UI (palette, table, progress)
├── extensions/                     # 42+ npm workspace packages (dynamic import via jiti)
│   ├── telegram/                   # Telegram channel plugin
│   ├── discord/                    # Discord channel plugin
│   ├── slack/                      # Slack channel plugin
│   ├── matrix/                     # Matrix channel plugin
│   ├── msteams/                    # MS Teams channel plugin
│   ├── anthropic/                  # Anthropic provider plugin
│   ├── openai/                     # OpenAI provider plugin
│   ├── google/                     # Google provider plugin
│   ├── ollama/                     # Ollama provider plugin
│   ├── memory-core/                # Core memory backend
│   ├── memory-lancedb/             # LanceDB vector memory
│   └── ...                         # 30+ more extensions
├── docs/                           # Mintlify docs (hosted at docs.openclaw.ai)
├── dist/                           # Built output (tsdown + runtime postbuild)
├── apps/
│   ├── macos/                      # macOS menubar app (SwiftUI)
│   ├── ios/                        # iOS app (SwiftUI)
│   └── android/                    # Android app (Kotlin)
├── scripts/                        # Build, test, release automation
├── openclaw.mjs                    # CLI wrapper (calls dist/entry.js)
└── package.json                    # Root workspace config (pnpm)
```

**Extension pattern:** Each extension is an npm workspace package under `extensions/`. Runtime loads extensions dynamically via jiti. Extensions export channel/provider/tool registrations. Plugin dependencies live in extension `package.json` (not root). Avoid `workspace:*` in `dependencies` (breaks npm install); use `devDependencies` or `peerDependencies` for `openclaw` references.

**Channel registration:** Channels self-register via plugin entrypoints. Core channels defined in `src/channels/registry.ts` (CHAT_CHANNEL_ORDER). Extension channels register via plugin SDK. All channels share routing, pairing, allowlist, and command gating logic.

**Config:** `~/.openclaw/config.json` + `OPENCLAW_*` env vars. Gateway mode: `gateway.mode=local`. Credentials: `~/.openclaw/credentials/` (encrypted). Sessions: `~/.openclaw/sessions/` (JSONL).

## WHERE TO LOOK

| Task               | Path                                                                          | Notes                                                    |
| ------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------- |
| CLI entrypoint     | src/entry.ts                                                                  | Respawn logic, compile cache, env normalization          |
| Gateway server     | src/gateway/server.ts                                                         | WebSocket server, 249 modules, port 18789                |
| Channel registry   | src/channels/registry.ts                                                      | 22+ channels, metadata, self-registration                |
| Plugin SDK         | src/plugin-sdk/                                                               | core, compat, routing, sandbox, provider-setup           |
| Core channels      | src/telegram, src/discord, src/slack, src/signal, src/imessage, src/web       | Built-in channel implementations                         |
| Extension channels | extensions/matrix, extensions/msteams, extensions/irc, extensions/googlechat  | Plugin channel implementations                           |
| Providers          | extensions/anthropic, extensions/openai, extensions/google, extensions/ollama | LLM provider plugins                                     |
| Provider helpers   | src/providers/                                                                | GitHub Copilot auth, Google shared, Qwen OAuth           |
| Memory backends    | extensions/memory-core, extensions/memory-lancedb                             | Memory/vector storage plugins                            |
| Terminal UI        | src/terminal/                                                                 | palette, table, progress (osc-progress + @clack/prompts) |
| Build pipeline     | scripts/tsdown-build.mjs, scripts/runtime-postbuild.mjs                       | tsdown + postbuild steps                                 |
| Tests              | \*_/_.test.ts                                                                 | Colocated tests, Vitest, 70% coverage threshold          |
| Docs               | docs/                                                                         | Mintlify docs (docs.openclaw.ai)                         |
| Mobile apps        | apps/macos, apps/ios, apps/android                                            | SwiftUI (macOS/iOS), Kotlin (Android)                    |

## CONVENTIONS

**Language:** TypeScript ESM. Strict typing required. Never use `@ts-nocheck` or disable `no-explicit-any`. Fix root causes.

**Formatting/linting:** oxlint (type-aware) + oxfmt. Run `pnpm check` before commits. Never mix `await import("x")` and static `import ... from "x"` for the same module. Use dedicated `*.runtime.ts` boundaries for lazy loading. Check for `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings after refactors.

**File size:** Keep files under ~700 LOC (guideline, not hard limit). Split/refactor when it improves clarity.

**Naming:** Use **OpenClaw** for product/docs headings. Use `openclaw` for CLI, package, paths, config keys. American spelling in all code/docs/UI.

**Testing:** Vitest with V8 coverage (70% threshold). Colocated `*.test.ts`. E2E in `*.e2e.test.ts`. Run `pnpm test` before pushing. Use `pnpm test -- <path>` for targeted runs (don't bypass wrapper). Live tests: `CLAWDBOT_LIVE_TEST=1 pnpm test:live`.

**Commits:** Use `scripts/committer "<msg>" <file...>` to scope staging. Concise, action-oriented messages (e.g., `CLI: add verbose flag to send`). Group related changes.

**Extensions:** Plugin-only deps go in extension `package.json`, not root. Runtime deps in `dependencies`. Avoid `workspace:*` in `dependencies` (breaks npm install). Put `openclaw` in `devDependencies` or `peerDependencies`. Runtime resolves `openclaw/plugin-sdk` via jiti alias.

**Dynamic imports:** Never mix `await import("x")` and static `import ... from "x"` for the same module in production code. Create `*.runtime.ts` boundaries for lazy loading. Run `pnpm build` and check for `[INEFFECTIVE_DYNAMIC_IMPORT]` warnings.

**Class behavior:** Never share via prototype mutation. Use explicit inheritance/composition (`A extends B extends C`) or helper composition. TypeScript must typecheck all members.

**Progress/status:** Use `src/cli/progress.ts` (osc-progress + @clack/prompts). Use `src/terminal/table.ts` for tables. `status --all` = read-only, `status --deep` = probes.

**Docs:** Mintlify-hosted (docs.openclaw.ai). Internal links: root-relative, no `.md`/`.mdx` (e.g., `[Config](/configuration)`). Avoid em dashes/apostrophes in headings (breaks anchors). Generic content only (no personal device names/paths).

**Changelog:** User-facing changes only. Append to end of section (`### Changes` or `### Fixes`). At most one contributor mention per line. Pure test changes don't need changelog entries unless user-facing.

**Release channels:** stable (vYYYY.M.D, npm `latest`), beta (vYYYY.M.D-beta.N, npm `beta`), dev (main branch, no tag).

## ANTI-PATTERNS

- Never commit secrets, real phone numbers, videos, or live config values
- Never add `@ts-nocheck` or disable `no-explicit-any` without fixing root cause
- Never mix `await import("x")` and static `import ... from "x"` for same module
- Never share class behavior via prototype mutation
- Never add plugin deps to root `package.json` unless core uses them
- Never use `workspace:*` in extension `dependencies` (breaks npm install)
- Never bypass `pnpm test` wrapper (use `pnpm test -- <path>` for targeted runs)
- Never edit `node_modules` (updates overwrite; put notes in AGENTS.md or tools.md)
- Never update Carbon dependency without approval
- Never patch dependencies (pnpm patches, overrides, vendored changes) without approval
- Never use exact versions with `pnpm.patchedDependencies` (must be exact, no `^`/`~`)
- Never hand-roll spinners/progress bars (use src/cli/progress.ts)
- Never hardcode colors in CLI output (use src/terminal/palette.ts)
- Never add heavy dependencies for minor convenience
- Never bundle unrelated refactors with functional changes
- Never skip pre-commit hooks (`prek install` runs same checks as CI)

## COMMANDS

```bash
# Install
pnpm install                        # Install all workspace deps

# Dev
pnpm openclaw ...                   # Run CLI in dev (via bun)
pnpm dev                            # Alternative dev entrypoint

# Build
pnpm build                          # Full build (tsdown + postbuild + plugin SDK)
pnpm tsgo                           # TypeScript type-check only

# Lint/format
pnpm check                          # Full check (format + lint + type-check)
pnpm format:check                   # oxfmt --check
pnpm format:fix                     # oxfmt --write
pnpm lint                           # oxlint --type-aware
pnpm lint:fix                       # oxlint --type-aware --fix

# Test
pnpm test                           # Run all tests (Vitest)
pnpm test:coverage                  # Run with coverage report
pnpm test -- <path>                 # Targeted test run
pnpm test:live                      # Live tests (requires CLAWDBOT_LIVE_TEST=1)
pnpm test:e2e                       # E2E tests
pnpm test:docker:all                # Full Docker test suite

# Gateway
pnpm gateway:dev                    # Start gateway in dev mode
pnpm gateway:watch                  # Watch mode with auto-restart

# Mobile
pnpm ios:open                       # Open iOS project in Xcode
pnpm ios:run                        # Build and run iOS app
pnpm android:run                    # Build and run Android app

# Docs
pnpm docs:dev                       # Start Mintlify dev server
pnpm docs:check-links               # Check doc link integrity

# Release (maintainers only)
pnpm release:check                  # Pre-release validation
```

## NOTES

- **Runtime:** Node 22+ required. Bun supported for dev/test (keep both paths working).
- **Gateway:** Runs on port 18789 (WebSocket + HTTP). Bind via `gateway.host` / `gateway.port` config.
- **Extensions:** 42 workspace packages under `extensions/`. Dynamic loading via jiti. No restart required.
- **Plugin SDK:** 30+ exported modules (`openclaw/plugin-sdk`, `openclaw/plugin-sdk/core`, etc.). See package.json exports.
- **Channels:** 22+ built-in (Telegram, Discord, WhatsApp, Slack, Signal, iMessage, IRC, Matrix, etc.). Self-registration pattern.
- **Config:** `~/.openclaw/config.json` + `OPENCLAW_*` env vars. Credentials at `~/.openclaw/credentials/` (encrypted).
- **Sessions:** JSONL logs at `~/.openclaw/sessions/`. Not configurable.
- **Docs:** Mintlify-hosted at docs.openclaw.ai. Root-relative links, no `.md`/`.mdx` extensions.
- **Coverage:** 70% threshold (lines/branches/functions/statements). V8 provider.
- **Respawn:** CLI respawns with `--disable-warning=ExperimentalWarning` unless `OPENCLAW_NO_RESPAWN=1`.
- **Compile cache:** Enabled by default unless `NODE_DISABLE_COMPILE_CACHE=1`.
- **Multi-agent safety:** Don't create/drop git stash, don't switch branches, don't modify worktrees unless requested.
- **Lint/format churn:** Auto-resolve formatting-only diffs. Only ask when changes are semantic.
- **macOS gateway:** Runs as menubar app. Restart via app or `scripts/restart-mac.sh`. Don't use ad-hoc tmux sessions.
- **SwiftUI:** Prefer `Observation` framework (`@Observable`, `@Bindable`) over `ObservableObject`/`@StateObject`.
- **Version locations:** package.json, apps/android/app/build.gradle.kts, apps/ios/Sources/Info.plist, apps/macos/Sources/OpenClaw/Resources/Info.plist, docs/install/updating.md.
- **Release auth:** Core `openclaw` uses GitHub trusted publishing (no NPM_TOKEN). Separate flow for `@openclaw/*` plugins.
- **Changelog:** User-facing only. Append to section end. At most one contributor mention per line.
- **Beta releases:** Tag `vYYYY.M.D-beta.N`, publish npm with matching suffix (not plain version on `--tag beta`).
