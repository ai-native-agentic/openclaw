# AGENTS.md — .harness/

QA gate scaffolding for openclaw. Runs lightweight checks before/after AI-driven changes.

## OVERVIEW

- `config.yaml` — gate enable/disable flags (gate_a through gate_f)
- `run-gates.sh` — executes enabled gates, exits 1 on any FAIL
- Gates: syntax (A), shellcheck (B), structure (C), dist-artifact (D), format (E), plugin-sdk-exports (F)

## COMMANDS

```bash
bash .harness/run-gates.sh          # run all enabled gates
```

## ADDING A GATE

1. Add `gate_X: enabled: true` to `config.yaml`
2. Add `run_gate "label" "command"` to `run-gates.sh` after Gate C block
3. Verify command exits 0 on clean repo before enabling

## CONVENTIONS

- Gates must be fast (<30s) and deterministic
- Use `skip_gate` for optional checks (e.g. tool not installed)
- Gate labels: lowercase, hyphen-separated (e.g. `dist-artifact`)
- Commands run from `$PROJECT_ROOT`
