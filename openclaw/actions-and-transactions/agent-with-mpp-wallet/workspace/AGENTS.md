# AGENTS.md — Agent with Wallet Workspace

## Workspace Layout

```
workspace/
  SOUL.md           # Who you are
  AGENTS.md         # This file — how you work
  IDENTITY.md       # Your name and persona
  TOOLS.md          # Environment-specific notes
  BOOTSTRAP.md      # First-run setup (delete after setup)
  HEARTBEAT.md      # Periodic task config
  USER.md           # About your human
  MEMORY.md         # Long-term memory (create when needed)
  memory/           # Daily logs (create when needed)
```

## Workflow

1. **Build** runs automatically after each `git push` (Tempo skill fetch + CLI install)
2. **Start** is a no-op — the agent operates via conversation, not a web server

## Conventions
- Commit with conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`

## Memory

- Create `memory/` directory for daily logs when needed
- Create `MEMORY.md` for long-term context when needed
- Update `TOOLS.md` with environment-specific notes as you discover them

## Safety

- Never push directly to `main` — always use feature branches + PRs
- Ask before deploying to production
- Don't run destructive commands without confirmation
- Never execute transactions over 1 usd without user confirmation
