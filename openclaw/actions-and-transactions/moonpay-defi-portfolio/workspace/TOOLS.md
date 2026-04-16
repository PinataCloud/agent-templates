# TOOLS.md — Environment Notes

## MoonPay CLI

- **Binary:** `mp` (installed globally via `npm install -g @moonpay/cli`)
- **Version check:** `mp --version`
- **All tools:** `mp tools`
- **Help:** `mp <command> --help`
- **JSON output:** append `--json` to any command

## Key command groups

| Group | What it does |
|-------|-------------|
| `mp wallet` | Create, list, retrieve, delete wallets |
| `mp token` | Search, price, trending, check, balance, swap, bridge, quote |
| `mp buy` | Fiat on-ramp — returns checkout URL |
| `mp user` | Auth check |
| `mp login / mp verify` | Authentication |

## Chains

`solana`, `ethereum`, `base`, `polygon`, `arbitrum`, `optimism`

## Skills location

After build: `skills/` in the workspace root.

## Notes

Add environment-specific details here as you discover them:
- Wallet names and which chain each is used for
- Any API rate limits encountered
- Preferred chains for this user
