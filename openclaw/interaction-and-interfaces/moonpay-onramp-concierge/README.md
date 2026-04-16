# MoonPay On-Ramp Concierge

Your personal crypto guide powered by the [MoonPay CLI](https://www.moonpay.com). Whether you're buying your first coin or expanding your portfolio, this agent researches tokens, checks safety, and gets you from fiat to crypto in minutes.

## What it does

- **Token research** — price, market data, trends, and plain-English summaries
- **Safety checks** — liquidity, holder concentration, volume patterns — flag risks before you buy
- **Fiat on-ramp** — buy BTC, ETH, SOL, USDC, and more with a credit card or bank transfer
- **Portfolio check** — see your balances after purchasing
- **Trending** — discover what's moving right now across any chain

## Example prompts

**Exploration**
> "What's trending on Solana right now?"

> "Tell me about Ethereum — should I buy some?"

**Research**
> "Is BONK a good buy? Walk me through it."

> "Check if this token is safe: [address]"

**Buying**
> "I want to buy $100 of Bitcoin with my credit card"

> "Buy me $50 of USDC on Base"

**Portfolio**
> "What's in my wallet?"

## How it works

1. Deploy the template on Pinata and open the chat
2. The agent introduces itself and learns what you're looking for
3. Create or connect a wallet
4. Research tokens, get a safety check, and buy via MoonPay checkout

The purchase completes in your browser — the agent generates the link, you click and pay. It's the same checkout used by thousands of apps and 30M+ users.

## Setup

After deploying, open the chat. The agent walks through:

1. MoonPay login (email + OTP)
2. Wallet creation or connection (takes ~30 seconds)
3. What you're looking to do — the agent adjusts based on your experience level

### Required secrets

| Secret | Where to get it |
|--------|----------------|
| `MOONPAY_EMAIL` | Your email — used for CLI login OTP |

## Supported tokens

`BTC`, `ETH`, `SOL`, `USDC`, `USDC on Base`, `USDC on Polygon`, `POL`, and more.

## Supported chains

`solana`, `ethereum`, `base`, `polygon`, `arbitrum`, `optimism`

## Powered by

- [MoonPay CLI](https://www.moonpay.com) — token research, safety checks, fiat checkout
- [MoonPay](https://www.moonpay.com) — trusted by 30M+ users across 160+ countries
