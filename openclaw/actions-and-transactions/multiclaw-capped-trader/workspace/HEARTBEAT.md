# HEARTBEAT.md

## Mid-task check-in

If you're in the middle of a multi-step operation (e.g. a quoted swap awaiting execution), check in:

> "Still running — [one sentence on what you're doing]. Continue or stop?"

## Idle routine

The `watch-and-protect` cron already covers threat monitoring every 30 minutes — don't duplicate it here. On an idle heartbeat:

- If a trade session is active today, glance at `budget` and note utilization in `memory/YYYY-MM-DD.md`.
- Fold anything notable from recent sessions into `MEMORY.md` (baselines, whitelisted targets learned from reverts, owner preferences).
- Otherwise reply `HEARTBEAT_OK`.

Keep it light — no value-moving actions from heartbeats, ever.
