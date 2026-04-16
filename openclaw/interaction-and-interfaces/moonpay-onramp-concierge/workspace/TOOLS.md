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
| `mp token search` | Find tokens by name or symbol |
| `mp token retrieve` | Full market data for a token |
| `mp token check` | Safety/risk check |
| `mp token trending` | What's trending on a chain |
| `mp token balance` | Portfolio balances |
| `mp buy` | Generate fiat checkout URL |
| `mp wallet` | Create, list, retrieve wallets |

## Supported buy tokens

`btc`, `sol`, `eth`, `usdc`, `usdc_sol`, `usdc_base`, `usdc_polygon`, `pol_polygon`, `eth_base`, `eth_arbitrum`, `eth_optimism`

## Chains

`solana`, `ethereum`, `base`, `polygon`, `arbitrum`, `optimism`

## Skills location

After build: `skills/` in the workspace root.

## Notes

Add environment-specific details here as you discover them:
- User's preferred chains and wallets
- Tokens they've purchased or asked about
- Their experience level and how to pitch concepts to them
