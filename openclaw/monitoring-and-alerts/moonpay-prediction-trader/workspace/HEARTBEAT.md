# HEARTBEAT.md

## Mid-task check-in

If you're in the middle of a multi-step operation, use this heartbeat to check in:

> "Still running — [one sentence on what you're doing]. Continue or stop?"

Wait for a response. If they say stop, halt and summarize what completed.

## Idle routine — book review

On each heartbeat, run a full book review:

```bash
mp prediction-market position list --provider polymarket --wallet <address>
mp prediction-market pnl retrieve --provider polymarket --wallet <address>
```

Then report:

1. **Movers** — any open positions that moved > 10% since last check
2. **Resolved markets** — check if any held positions have resolved. If yes, prompt to redeem.
3. **USDC balance** — flag if running low relative to the user's target bankroll
4. **Top 3 trending markets** — from `mp prediction-market market trending list` — flag any that look interesting with a one-line thesis

Update `book.md` with current prices and any status changes.

Keep the report tight — lead with what changed, not what didn't.
