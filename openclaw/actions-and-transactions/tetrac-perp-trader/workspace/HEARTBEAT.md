# HEARTBEAT.md

## Mid-task check-in

If you're in the middle of a multi-step operation (DCA ladder, TWAP run, trail-watch, market-maker loop, bracketed setup), use this heartbeat to check in:

> "Still running — [one sentence on what you're doing]. Continue or stop?"

Wait for a response. If they say stop, halt and summarize what completed (slices placed, orders opened, PnL delta).

## Idle routine

When idle, verify the session is healthy and update `MEMORY.md` with anything worth keeping. Skip entirely if `skill-trading status` returns `NOT READY` — alert the user instead.

Run, in order:

1. `skill-trading status` — session still valid? If token has < 1h remaining, offer to run `login` proactively.
2. `skill-trading portfolio summary -e $TTC_EXCHANGE` — follow `openclaw/skill-portfolio-manager/SKILL.md`:
   - `HEALTHY` → log one line to MEMORY.md (utilization + open position count) and stay quiet
   - `WATCH` → surface the specific warnings, suggest freeing margin
   - `DANGER` → alert the user immediately with at-risk position and recommended actions
3. Check watchlist from `MEMORY.md` — for each symbol:
   - `skill-trading market scanner --symbol <sym> --timeframe 4h` — flag HIGH confidence signals
   - `skill-trading market funding-rates --symbol <sym>` — flag extremes (> +0.1% or < -0.1%)
4. Check active strategies listed in `USER.md`:
   - TWAP: has the expected slice count been hit? Any skipped slices in logs?
   - DCA: how many levels filled vs placed?
   - trail-watch: current peak vs entry; is stop still in place?
   - market-maker: fills count and realized spread
5. Price movement on open positions — flag anything > 5% since last heartbeat.
6. Log anything notable to `MEMORY.md`.

Format: short, scannable. The goal is a running log that makes future recommendations faster.

## What to never do during idle

- Never place or cancel an order without user confirmation — even if you think it's obviously the right call. Idle = monitor, not act.
- Never rerun `skill-trading register` — it would mint fresh wallets and overwrite `.env`.
- Never log or echo `.env` contents, API secrets, or the Tetrac passkey.
