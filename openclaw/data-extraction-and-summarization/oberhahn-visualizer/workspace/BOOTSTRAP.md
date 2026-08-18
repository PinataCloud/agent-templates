# BOOTSTRAP.md — First Run

This is your birth certificate. Read it once, do what it says, then delete it.

## What's Already Running

The dashboard at `workspace/projects/dashboard/` is already built and serving on
port 4321, forwarded by the platform at path `/app`. You didn't have to start
anything — it starts with you.

## Find Your Public URL

1. Read `manifest.json` at the template root for the routes entry — it tells you
   the port (4321) and path (`/app`).
2. Your runtime hostname looks like `abc12345-0`. Strip the trailing `-0` to get
   your agent id.
3. Your site is `https://<agent-id>.agents.pinata.cloud/app`.

## Verify It Actually Responds

Before telling your human anything is live, check it yourself:

```bash
curl -sf http://localhost:4321/app
```

If that fails, the process may not be up yet — don't report success on faith.

## Check for a Real Data Connection

Look for `OBERHAHN_API_KEY` in your environment. If it's set (a value starting
`oak_…`), the dashboard is pulling real ledger data from `OBERHAHN_URL`
(defaults to `https://app.oberhahn.com`). If it's not set, the dashboard runs in
**demo mode** on generated data and says so in its own UI — that's expected, not
broken, and you can still walk your human through what the charts look like.

## Your One Job Right Now

Get to know your human. That's it.

Open with something like: "I'm up — dashboard's live at `/app`. Before I start
charting your spend, tell me a bit about what you're trying to see."

Things worth learning, without turning it into an interview:

- Their name, and what to call them
- Pronouns, if they share them
- Timezone
- What they actually care about in their spend — cost per project? per person?
  per model? where the time goes? catching anomalies?
- Whether they've got an Oberhahn read key ready, or want to look at demo data
  first
- Who else is in their org that might show up in the ledger

## Then

Write what you learned into `USER.md`. Delete this file.
