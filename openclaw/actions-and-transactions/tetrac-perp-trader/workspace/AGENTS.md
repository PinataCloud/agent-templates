# AGENTS.md — Tetrac Perp Trader Workspace

## Workspace Layout

```
workspace/
  SOUL.md        # Who you are and how you operate
  AGENTS.md      # This file — workspace conventions
  IDENTITY.md    # Your name, persona, and trading context (fill in on first run)
  TOOLS.md       # CLI notes and environment details
  BOOTSTRAP.md   # First-run setup (delete after setup)
  HEARTBEAT.md   # Periodic check-in config
  USER.md        # About your human
  MEMORY.md      # Long-term memory (create when needed)
  memory/        # Session logs (create when needed)
```

## Skills

Skills are installed at build time by `setup.sh` — it clones `rust-cli-ttc-api` and copies eleven skill folders into `skills/` at the repo root. Read the relevant `SKILL.md` before using a command group for the first time.

```
skills/
  skill-onboarding/SKILL.md         # First-run auth + exchange setup
  skill-trading/SKILL.md            # Core safe-trading protocol (always follow)
  skill-portfolio-manager/SKILL.md  # HEALTHY / WATCH / DANGER decision tree
  skill-market-overview/SKILL.md    # Regime + funding + OI + movers briefing
  skill-shark/SKILL.md              # Bracketed signal-driven entries (R/R ≥ 2)
  skill-signal-patrol/SKILL.md      # Watchlist scan for HIGH R/R ≥ 3 setups
  skill-momentum/SKILL.md           # 10%+ movers with volume
  skill-twap/SKILL.md               # Unattended TWAP execution
  skill-loop-trading/SKILL.md       # Agent-owned loop via /loop + twap-slice
  skill-dca/SKILL.md                # Stepped limit-order ladder
  skill-market-maker/SKILL.md       # Limit-order spread capture
```

## Workflow

1. Build runs `setup.sh` — installs the `skill-trading` binary to `$HOME/.skill-trading/bin/skill-trading` and copies skills to `skills/` at the repo root.
2. The agent operates via conversation — no web server.
3. All order, risk, and position mutations require explicit user confirmation before execution.
4. `skill-trading status` gates every trading session. `skill-trading portfolio summary` gates every new position.

## Memory

- Create `memory/YYYY-MM-DD.md` for session logs (what the user asked, what was executed, fills, PnL deltas).
- Create `MEMORY.md` for persistent context — watchlist, active DCA/TWAP runs, trailing stops in flight, user's typical size and leverage, funding-rate calls.
- Update `TOOLS.md` and `USER.md` as environment and user details surface.

## Conventions

- **Confirm before mutating.** Every order, cancel, close, sl/tp/trail, dca, twap, market-maker call gets an explicit user confirmation showing exchange · symbol · side · qty · price.
- **Pre-flight gate.** Run `skill-trading status` + `skill-trading portfolio summary -e $TTC_EXCHANGE` before any order.
- **Dry-run first** on unfamiliar parameter combos, especially `dca` and `twap`.
- **One exchange, clear context** — pass `-e` explicitly on every command so the log is unambiguous.
- **Never echo secrets.** `.env`, API secrets, and the Tetrac passkey never appear in chat after they're written.
