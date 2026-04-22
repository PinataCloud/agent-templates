# MoonPay DeFi Portfolio Manager

A full-stack DeFi agent powered by the [MoonPay CLI](https://www.moonpay.com). Research tokens, check safety, buy crypto with fiat, execute swaps across chains, and set up automated DCA strategies — all from one agent.

## What it does

- **Portfolio tracking** — live balances and PnL across Solana, Ethereum, Base, and more
- **Token research** — price, market data, 24h trends, and safety checks for any token
- **Swaps & bridges** — same-chain swaps and cross-chain bridges, signed locally
- **Fiat on-ramp** — buy BTC, ETH, SOL, USDC, and more with a credit card or bank transfer
- **DCA automation** — set up recurring buy strategies on a cron schedule

## Example prompts

**Portfolio**
> "Show me my portfolio on Solana"

**Token research**
> "Is $WIF safe to buy? Give me a full brief."

**Swap**
> "Swap 0.5 SOL to USDC on Solana"

**Buy with fiat**
> "I want to buy $200 of ETH with my credit card"

**Bridge**
> "Bridge 50 USDC from Ethereum to Base"

**DCA**
> "Set up a $50/week DCA into SOL"

## How it works

1. Deploy the template on Pinata and open the chat
2. The agent introduces itself and logs into MoonPay
3. Create or connect a wallet
4. Ask anything — the agent researches, quotes, and executes with your confirmation

All transactions require explicit confirmation before executing. Swaps and bridges are signed locally — your keys never leave the machine.

## Setup

After deploying, open the chat. The agent walks through:

1. MoonPay login (email + OTP)
2. Wallet creation or connection
3. Chain selection
4. First portfolio snapshot

### Required secrets

| Secret | Where to get it |
|--------|----------------|
| `MOONPAY_EMAIL` | Your email — used for CLI login OTP |

## Supported chains

`solana`, `ethereum`, `base`, `polygon`, `arbitrum`, `optimism`

## Powered by

- [MoonPay CLI](https://www.moonpay.com) — wallets, swaps, on-ramp, portfolio
- [swaps.xyz](https://swaps.xyz) — DEX aggregation for swaps and bridges
