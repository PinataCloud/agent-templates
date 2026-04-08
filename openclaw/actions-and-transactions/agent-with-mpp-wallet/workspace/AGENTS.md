# AGENTS.md — Agent with Wallet Workspace

## Workspace Layout

```
workspace/
  projects/         # All code projects live here
    starter/        # Default Vite + React + TS scaffold
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

1. **Active project:** `projects/starter/` — the Vite dev server runs on port 5173 with HMR
2. **Build** runs automatically after each `git push` (`npm install` + Tempo skill fetch)
3. **Start** runs on every agent boot (`npx vite --host 0.0.0.0`)
4. **Preview** the app at your agent's URL under `/app`

## Conventions

- Use `projects/` for all code — keep workspace root clean
- One project per directory
- Don't install `node_modules` locally if builds happen remotely (saves resources)
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
