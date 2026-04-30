#!/usr/bin/env bash
set -e

# ── Tempo skill ────────────────────────────────────────────────────────────────
mkdir -p skills/tempo
curl -fsSL https://tempo.xyz/SKILL.md -o skills/tempo/SKILL.md || true
echo "Tempo skill ready."

# ── Tempo CLI ─────────────────────────────────────────────────────────────────
if [ ! -f "$HOME/.tempo/bin/tempo" ]; then
  GLIBC_VERSION=$(ldd --version 2>/dev/null | awk 'NR==1{print $NF}')
  GLIBC_MAJOR=$(echo "$GLIBC_VERSION" | cut -d. -f1)
  GLIBC_MINOR=$(echo "$GLIBC_VERSION" | cut -d. -f2)

  NEEDS_PATCH=0
  if [ -z "$GLIBC_VERSION" ]; then
    echo "WARNING: could not detect glibc — skipping Tempo CLI install"
    exit 0
  elif [ "$GLIBC_MAJOR" -lt 2 ] || { [ "$GLIBC_MAJOR" -eq 2 ] && [ "$GLIBC_MINOR" -lt 38 ]; }; then
    echo "glibc $GLIBC_VERSION detected — patching to 2.42 before install"
    NEEDS_PATCH=1
    mkdir -p "$HOME/.tempo/glibc"
    curl -L -o /tmp/libc6.deb \
      "https://snapshot.debian.org/archive/debian/20260419T203450Z/pool/main/g/glibc/libc6_2.42-15_amd64.deb"
    # Validate the download is actually a .deb before proceeding
    if ! dpkg-deb --info /tmp/libc6.deb > /dev/null 2>&1; then
      echo "ERROR: libc6.deb download failed or is not a valid Debian archive"
      exit 1
    fi
    dpkg-deb -x /tmp/libc6.deb "$HOME/.tempo/glibc/"
    curl -L -o /tmp/patchelf.tar.gz \
      "https://github.com/NixOS/patchelf/releases/download/0.18.0/patchelf-0.18.0-x86_64.tar.gz"
    mkdir -p /tmp/patchelf-extract
    tar xzf /tmp/patchelf.tar.gz -C /tmp/patchelf-extract/
    cp /tmp/patchelf-extract/bin/patchelf "$HOME/.tempo/glibc/patchelf"
    chmod +x "$HOME/.tempo/glibc/patchelf"
  else
    echo "glibc $GLIBC_VERSION — no patch needed"
  fi

  curl -fsSL https://tempo.xyz/install | bash

  if [ "$NEEDS_PATCH" -eq 1 ]; then
    GLIBC_LIB="$HOME/.tempo/glibc/usr/lib/x86_64-linux-gnu"
    "$HOME/.tempo/glibc/patchelf" \
      --set-interpreter "$GLIBC_LIB/ld-linux-x86-64.so.2" \
      --set-rpath "$GLIBC_LIB" \
      "$HOME/.tempo/bin/tempo"
    echo "Patched tempo binary."
  fi

  "$HOME/.tempo/bin/tempo" --version
  echo "Tempo CLI ready."
else
  echo "Tempo CLI already installed."
fi

# ── Patch tempo-wallet if it appeared since last start ────────────────────────
# tempo-wallet is downloaded on first wallet login, so it may not exist at build
# time. Runs on every start to catch and patch it once it appears.
if [ -d "$HOME/.tempo/glibc" ] && [ -f "$HOME/.tempo/bin/tempo-wallet" ]; then
  GLIBC_LIB="$HOME/.tempo/glibc/usr/lib/x86_64-linux-gnu"
  if ! "$HOME/.tempo/glibc/patchelf" --print-interpreter "$HOME/.tempo/bin/tempo-wallet" 2>/dev/null | grep -q ".tempo/glibc"; then
    "$HOME/.tempo/glibc/patchelf" \
      --set-interpreter "$GLIBC_LIB/ld-linux-x86-64.so.2" \
      --set-rpath "$GLIBC_LIB" \
      "$HOME/.tempo/bin/tempo-wallet"
    echo "Patched tempo-wallet binary."
  fi
fi
