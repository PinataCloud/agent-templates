# AGENTS.md — On-Ramp Concierge Workspace

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
  moonpay-buy-crypto.md
  moonpay-check-wallet.md
```

## Workflow

1. Build runs `setup.sh` — installs the MoonPay CLI and skills
2. The agent operates entirely via conversation — no web server
3. Purchases complete in the user's browser via MoonPay checkout link

## Memory

- Create `MEMORY.md` to track the user's interests, experience level, and past purchases
- Create `memory/YYYY-MM-DD.md` for session notes
- Update `USER.md` as you learn more about the user over time

## Conventions

- Always research a token before recommending a purchase
- Always confirm the checkout details before generating a link
- The checkout URL is the only handoff — never attempt to handle payment yourself
