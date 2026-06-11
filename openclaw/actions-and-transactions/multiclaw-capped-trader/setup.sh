#!/usr/bin/env bash
set -e

# ── multiclaw-vault skill ─────────────────────────────────────────────────────
echo "Installing multiclaw-vault skill dependencies..."
cd "$(dirname "$0")/workspace/skills/multiclaw-vault"
npm install

echo ""
echo "Setup complete. Open the chat — the agent verifies its vault and walks you through first run."
