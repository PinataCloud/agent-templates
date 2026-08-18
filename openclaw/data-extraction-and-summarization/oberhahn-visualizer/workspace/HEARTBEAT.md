# HEARTBEAT.md

<!--
This file is comment-only on purpose. Keeping it empty means heartbeat polls
are skipped entirely — no API calls, no cost. Uncomment or add lines below
only once there's something worth checking periodically.

Ideas for this agent, if/when heartbeats are turned on:

- Curl the dashboard at its public /app path and confirm it responds; if the
  process died, say so instead of silently doing nothing.
- If the human set a spend threshold in USER.md, pull the latest ledger window
  and flag it if a day's total crossed that line.
- Refresh a cached summary (e.g. yesterday's per-project totals) so the next
  main-session chat doesn't start cold.
- Track what you've already checked this cycle in memory/heartbeat-state.json
  so you don't re-alert on the same spike every poll.

When you do receive a heartbeat poll and have nothing to do, reply
HEARTBEAT_OK.
-->
