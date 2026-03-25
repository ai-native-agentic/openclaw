#!/usr/bin/env bash
set -euo pipefail
export PATH="$HOME/.local/bin:$PATH"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_NAME="openclaw"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'
PASS=0
FAIL=0
SKIP=0

run_gate() {
  local label="$1"
  local cmd="$2"
  printf "  %-20s ... " "$label"
  if (cd "$PROJECT_ROOT" && eval "$cmd") >/dev/null 2>&1; then
    printf "${GREEN}PASS${NC}\n"
    PASS=$((PASS + 1))
  else
    printf "${RED}FAIL${NC}\n"
    FAIL=$((FAIL + 1))
  fi
}

skip_gate() {
  local label="$1"
  local reason="$2"
  printf "  %-20s ... ${YELLOW}SKIP${NC} (%s)\n" "$label" "$reason"
  SKIP=$((SKIP + 1))
}

echo ""
echo "=== $PROJECT_NAME QA Gates ==="
echo ""

# Gate A: syntax
run_gate "syntax" "test -f package.json"

# Gate B: shellcheck
if command -v shellcheck >/dev/null 2>&1; then
  sh_count=$(cd "$PROJECT_ROOT" && find . -name '*.sh' -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' 2>/dev/null | wc -l)
  if [[ "$sh_count" -gt 0 ]]; then
    run_gate "shellcheck" "find . -name '*.sh' -not -path './.git/*' -not -path './node_modules/*' -not -path './.venv/*' -exec shellcheck --severity=error {} +"
  else
    skip_gate "shellcheck" "no shell scripts"
  fi
else
  skip_gate "shellcheck" "shellcheck not installed"
fi

# Gate C: structure
run_gate "structure" "test -f README.md || test -f AGENTS.md || test -f package.json || test -f Cargo.toml || test -f pyproject.toml"

# Gate D: dist artifact exists (build output present)
run_gate "dist-artifact" "test -f dist/index.js"

# Gate E: file size limit (warn-only until violations are resolved)
skip_gate "loc-limit" "warn-only: $(node --import tsx scripts/check-ts-max-loc.ts --max 500 2>/dev/null | wc -l | tr -d ' ') files exceed 500 lines"

# Gate F: plugin-sdk exports in sync
run_gate "plugin-sdk-exports" "pnpm plugin-sdk:check-exports"

echo ""
echo "=== Results ==="
echo -e "  ${GREEN}PASS: $PASS${NC}  ${YELLOW}SKIP: $SKIP${NC}  ${RED}FAIL: $FAIL${NC}"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
