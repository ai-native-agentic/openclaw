# AGENTS.md — openclaw/extensions

Extension plugin ecosystem for OpenClaw gateway. 65+ npm workspace packages implementing channels, providers, and utilities via the plugin SDK.

## STRUCTURE

Extensions are organized by type:

**Channel plugins** (messaging platforms):

- bluebubbles, discord, feishu, googlechat, imessage, irc, line, matrix, mattermost, msteams, nextcloud-talk, nostr, signal, slack, synology-chat, telegram, tlon, twitch, voice-call, whatsapp, zalo, zalouser

**Provider plugins** (AI model backends):

- acpx, amazon-bedrock, anthropic, brave, byteplus, cloudflare-ai-gateway, copilot-proxy, github-copilot, google, huggingface, kilocode, kimi-coding, minimax, mistral, modelstudio, moonshot, nvidia, ollama, openai, openrouter, perplexity, qianfan, qwen-portal-auth, sglang, together, venice, vercel-ai-gateway, vllm, volcengine, xai, xiaomi, zai

**Utility plugins**:

- device-pair, diagnostics-otel, diffs, firecrawl, llm-task, lobster, memory-core, memory-lancedb, open-prose, opencode, opencode-go, openshell, phone-control, synthetic, talk-voice, thread-ownership

**Shared infrastructure**:

- shared/, test-utils/

## WHERE TO LOOK

| Task                 | Extension                     | Notes                                             |
| -------------------- | ----------------------------- | ------------------------------------------------- |
| Add channel plugin   | discord/, slack/, telegram/   | Implement channel interface, register in index.ts |
| Add provider plugin  | openai/, anthropic/, google/  | Implement provider interface, handle auth/config  |
| Memory backends      | memory-core/, memory-lancedb/ | Core memory interface + vector search             |
| Observability        | diagnostics-otel/             | OpenTelemetry integration                         |
| Voice integration    | talk-voice/, voice-call/      | Voice channel implementations                     |
| Testing utilities    | test-utils/                   | Shared test helpers for extensions                |
| Plugin SDK reference | ../src/plugin-sdk/            | Core plugin interfaces and types                  |

## CONVENTIONS

**Package structure** (standard pattern):

```
<extension-name>/
├── package.json          # name: @openclaw/<name>, openclaw.extensions field
├── index.ts              # main extension export
├── setup-entry.ts        # optional setup/config UI (if present)
├── openclaw.plugin.json  # plugin metadata
└── src/                  # implementation files
```

**Dependencies**:

- Runtime deps go in `dependencies` (installed via `npm install --omit=dev`)
- Avoid `workspace:*` in `dependencies` (breaks npm install)
- Put `openclaw` in `devDependencies` or `peerDependencies` (runtime resolves via jiti alias)
- Extension-specific deps stay in extension `package.json`, not root

**Naming**:

- Channel plugins: `@openclaw/<platform>` (e.g., `@openclaw/discord`)
- Provider plugins: `@openclaw/<provider>-provider` or `@openclaw/<provider>` (e.g., `@openclaw/openai-provider`)
- Utility plugins: `@openclaw/<feature>` (e.g., `@openclaw/memory-core`)

**Testing**:

- Colocated `*.test.ts` files
- Use `test-utils/` for shared test helpers
- Run via root `pnpm test` (workspace-aware)

**Publishing**:

- Only publish already-on-npm `@openclaw/*` plugins
- Bundled disk-tree-only plugins stay unpublished
- Use maintainer-only auth flow (see parent AGENTS.md Release Auth section)

## ANTI-PATTERNS

- Do NOT add extension-only deps to root `package.json` (keep them scoped to extension)
- Do NOT use `workspace:*` in `dependencies` field (breaks npm install in plugin dir)
- Do NOT skip `openclaw.extensions` field in package.json (required for plugin discovery)
- Do NOT hardcode API keys or secrets (use config system)
- Do NOT mix channel/provider logic (keep interfaces clean)
- Do NOT skip error handling in channel send/listen or provider chat methods
