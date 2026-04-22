# MoonPay Prediction Market Trader

An autonomous prediction market agent powered by the [MoonPay CLI](https://www.moonpay.com). Scans Polymarket and Kalshi for mispricings, forms a thesis, places positions, and monitors your book — automatically.

## What it does

- **Market discovery** — trending markets by volume, search by keyword, browse by category
- **Research** — price history, market depth, outcome analysis
- **Trading** — buy and sell YES/NO shares on Polymarket and Kalshi
- **Book monitoring** — tracks open positions, flags movers, and alerts when markets resolve
- **PnL tracking** — running profit/loss across all open and closed positions
- **Auto-redeem** — prompts to redeem winning positions when markets resolve

## Example prompts

**Research**
> "What are the top 10 markets by volume on Polymarket right now?"

> "Show me all crypto-related markets on Kalshi"

**Analysis**
> "Walk me through the Trump 2028 market — what's the current price and how has it moved?"

**Trading**
> "Buy 100 YES shares on the Bitcoin ETF approval market at 0.72"

> "Sell half my position on the Fed rate cut market"

**Monitoring**
> "How's my book looking? Any positions that moved?"

> "What's my total PnL on Polymarket?"

## How it works

1. Deploy the template on Pinata and open the chat
2. The agent introduces itself and logs into MoonPay
3. Create or connect a wallet (EVM for Polymarket, Solana for Kalshi)
4. Register your wallet with the provider (one-time)
5. Fund with USDC — the agent generates a fiat checkout link if needed
6. Start trading — the agent surfaces opportunities and executes with your confirmation

Every position entry includes a full trade confirmation: market, outcome, price, size, cost, and your thesis before anything executes.

## Setup

After deploying, open the chat. The agent walks through:

1. MoonPay login (email + OTP)
2. Wallet setup (EVM + Solana)
3. Provider registration
4. USDC funding

### Required secrets

| Secret | Where to get it |
|--------|----------------|
| `MOONPAY_EMAIL` | Your email — used for CLI login OTP |

## Providers

| Provider | Chain | Currency |
|----------|-------|----------|
| Polymarket | Polygon | USDC.e |
| Kalshi | Solana | USDC |

## Powered by

- [MoonPay CLI](https://www.moonpay.com) — wallets, prediction market trading, fiat funding
- [Polymarket](https://polymarket.com) — on-chain prediction markets
- [Kalshi](https://kalshi.com) — regulated event contracts
