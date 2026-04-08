# TOOLS.md — Environment Notes

## Stack

- **Runtime:** Node.js 22+
- **Package Manager:** npm (or bun if available)
- **Framework:** Vite + React + TypeScript
- **Styling:** CSS Modules or scoped CSS
- **Tempo CLI:** `$HOME/.tempo/bin/tempo`
- **Tempo Skill:** `skills/tempo/SKILL.md` (fetched automatically at build time)

## Tools

- **Tempo CLI** — use for all service discovery, wallet operations, payments, and balance checks. Never use the web for these.
- **Web browser** — use for general research, user-requested web searches, fetching URLs, and anything the Tempo CLI doesn't cover. (Browser skill coming soon.)

## Notes

Add environment-specific details here as you discover them:
- SSH hosts, deploy targets, API keys location
- Pinata agent marketplace deployment details
- Any CI/CD quirks
- Tempo wallet address and balance notes
