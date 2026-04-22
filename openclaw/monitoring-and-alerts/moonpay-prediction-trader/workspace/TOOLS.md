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
| `mp prediction-market market` | Search, trending, event detail, price history |
| `mp prediction-market position` | Buy, sell, list, redeem |
| `mp prediction-market pnl` | PnL summary |
| `mp prediction-market trade` | Trade history |
| `mp prediction-market user` | Register wallet with provider |
| `mp token balance` | Check USDC balance before trading |
| `mp buy` | Fund wallet with fiat |
| `mp wallet` | Wallet management |

## Providers

| Provider | Chain | Token | Min liquidity to trade |
|----------|-------|-------|----------------------|
| Polymarket | Polygon | USDC.e | $10K+ recommended |
| Kalshi | Solana | USDC | $10K+ recommended |

## Skills location

After build: `skills/` in the workspace root.

## Notes

Add environment-specific details here as you discover them:
- Registered wallet addresses per provider
- USDC balance thresholds for this user
- Preferred providers and position sizes
