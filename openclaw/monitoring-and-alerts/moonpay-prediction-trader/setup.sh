#!/usr/bin/env bash
set -e

# ── MoonPay CLI ────────────────────────────────────────────────────────────────
if ! command -v mp &>/dev/null; then
  echo "Installing MoonPay CLI..."
  npm install -g @moonpay/cli
else
  echo "MoonPay CLI already installed: $(mp --version)"
fi

mp --version

# ── Install MoonPay skills into workspace ─────────────────────────────────────
echo "Installing MoonPay skills..."
mp skill install --dir openclaw --force

echo ""
echo "Setup complete. Open the chat to get started."
