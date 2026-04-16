# AGENTS.md — DeFi Portfolio Manager Workspace

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
```

## Skills

Skills are installed at build time via `mp skill install --dir openclaw`. Read the relevant skill file before using a new command group.

```
skills/
  moonpay-auth.md
  moonpay-discover-tokens.md
  moonpay-check-wallet.md
  moonpay-swap-tokens.md
  moonpay-buy-crypto.md
  moonpay-trading-automation.md
```

## Workflow

1. Build runs `setup.sh` — installs the MoonPay CLI and skills
2. The agent operates via conversation — no web server
3. All transactions require explicit user confirmation before execution

## Memory

- Create `memory/YYYY-MM-DD.md` for session logs
- Create `MEMORY.md` for persistent context (token watchlist, DCA schedules, preferred chains)
- Update `TOOLS.md` as you discover environment-specific details

## Conventions

- Confirm wallet identity before any transaction
- Always show a quote before executing a swap
- Use conventional commits if committing to the workspace repo
