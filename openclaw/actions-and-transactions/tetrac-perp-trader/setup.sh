#!/usr/bin/env bash
set -e

SKILL_TRADING_HOME="$HOME/.skill-trading"
SKILL_TRADING_BIN="$SKILL_TRADING_HOME/bin/skill-trading"
REPO_URL="https://gitlab.com/tradingtoolcrypto/rust-cli-ttc-api.git"
CLONE_DIR="/tmp/rust-cli-ttc-api"

SKILLS=(
  skill-onboarding
  skill-trading
  skill-shark
  skill-twap
  skill-dca
  skill-loop-trading
  skill-market-overview
  skill-momentum
  skill-signal-patrol
  skill-portfolio-manager
  skill-market-maker
)

# ── Clone the Tetrac CLI repo (contains prebuilt binaries + skills) ───────────
rm -rf "$CLONE_DIR"
echo "Fetching Tetrac skill-trading CLI..."
git clone --depth 1 "$REPO_URL" "$CLONE_DIR"

# ── Install the prebuilt binary for the current platform ──────────────────────
mkdir -p "$SKILL_TRADING_HOME/bin"
case "$(uname -sm)" in
  "Darwin arm64")
    BINARY="$CLONE_DIR/.claude/skills/skill-trading/scripts/skill-trading-darwin-arm64"
    ;;
  "Linux x86_64"|"Linux amd64")
    BINARY="$CLONE_DIR/.claude/skills/skill-trading/scripts/skill-trading-linux-x64"
    ;;
  *)
    echo "Unsupported platform: $(uname -sm)"
    exit 1
    ;;
esac

if [ ! -f "$BINARY" ]; then
  echo "Expected binary not found: $BINARY"
  exit 1
fi

cp "$BINARY" "$SKILL_TRADING_BIN"
chmod +x "$SKILL_TRADING_BIN"

# Expose on PATH for future shells and symlink into /usr/local/bin if writable
if ! grep -q "/.skill-trading/bin" "$HOME/.profile" 2>/dev/null; then
  echo 'export PATH="$HOME/.skill-trading/bin:$PATH"' >> "$HOME/.profile"
fi
if [ -w /usr/local/bin ]; then
  ln -sf "$SKILL_TRADING_BIN" /usr/local/bin/skill-trading
fi

"$SKILL_TRADING_BIN" info
echo "skill-trading CLI ready at $SKILL_TRADING_BIN"

# ── Install skills into ./openclaw ────────────────────────────────────────────
mkdir -p openclaw
for skill in "${SKILLS[@]}"; do
  SRC="$CLONE_DIR/.claude/skills/$skill"
  if [ ! -d "$SRC" ]; then
    echo "WARNING: skill not found in repo: $skill"
    continue
  fi
  rm -rf "openclaw/$skill"
  cp -r "$SRC" "openclaw/$skill"
  echo "  installed $skill"
done

# ── Clean up the clone ────────────────────────────────────────────────────────
rm -rf "$CLONE_DIR"

echo ""
echo "Setup complete. Open the chat to get started."
