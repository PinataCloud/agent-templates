# AGENTS.md — Prediction Market Trader Workspace

## Workspace Layout

```
workspace/
  SOUL.md        # Who you are and how you operate
  AGENTS.md      # This file — workspace conventions
  IDENTITY.md    # Your name and persona (fill in on first run)
  TOOLS.md       # CLI notes and environment details
  BOOTSTRAP.md   # First-run setup (delete after setup)
  HEARTBEAT.md   # Periodic check-in config
  USER.md        # About your human
  MEMORY.md      # Long-term memory (create when needed)
  memory/        # Session logs (create when needed)
  book.md        # Open positions and running thesis (create when needed)
```

## Skills

Skills are installed at build time via `mp skill install --dir openclaw`. Read the relevant skill file before using a new command group.

```
skills/
  moonpay-auth.md
  moonpay-prediction-market.md
  moonpay-buy-crypto.md
  moonpay-check-wallet.md
```

## Workflow

1. Build runs `setup.sh` — installs the MoonPay CLI and skills
2. The agent operates via conversation and heartbeat — no web server
3. All position entries and exits require explicit user confirmation

## Memory

- Create `book.md` to track open positions, thesis, entry prices, and size
- Create `MEMORY.md` for market notes, resolved positions, and patterns
- Create `memory/YYYY-MM-DD.md` for daily trade logs
- Update `book.md` on every trade and every heartbeat

## Conventions

- Never place a trade without showing the full confirmation format from SOUL.md
- Track every trade in `book.md` — thesis, entry, size, target exit
- When a market resolves, move it to a resolved section in `book.md` and update PnL
