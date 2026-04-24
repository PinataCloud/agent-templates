# Tetrac Perp Trader

A perpetual futures trading agent powered by the [Tetrac](https://ttc.box) `skill-trading` CLI. Scan 15+ exchanges, place orders, manage positions and risk, run TWAP and DCA ladders, and react to signals — all from chat.

## What it does

- **Multi-exchange trading** — Orderly, Phemex, Bybit, Binance, OKX, Bitget, BloFin, KuCoin, Hyperliquid, AsterDEX, BingX, and more
- **Full order lifecycle** — limit, market, stop-loss, take-profit; cancel individual or all
- **Position control** — view, close, detailed PnL (entry, mark, % move, margin used, liquidation distance)
- **Portfolio health** — aggregated balance + positions with `HEALTHY / WATCH / DANGER` status
- **Market data** — cross-exchange tickers, funding rates, open interest, volume snapshots
- **TTC scanner** — technical signal with entry, stop-loss, and take-profit levels
- **TWAP & DCA** — time-weighted execution and stepped limit ladders
- **Trailing stop watch** — polling loop that activates once a position enters profit
- **Morning brief** — pre-session briefing combining regime, funding, portfolio, and open orders

## Example prompts

**Account health**
> "How does my account look on Orderly?"

**Market briefing**
> "Run the morning brief."

**Trade setup**
> "Scan NEARUSDT on the 4h and set up a shark bracket if R/R ≥ 2."

**DCA ladder**
> "DCA $150 into NEAR across 10 levels, 1% apart."

**TWAP**
> "Buy $1000 of SOL over 4 hours."

**Trailing stop**
> "Watch my NEAR long and trail a 2% stop once it's in profit."

## How it works

1. Deploy the template on Pinata and open the chat
2. The agent runs `skill-trading status` to check auth and exchange credentials
3. If no Tetrac account exists, the agent runs `skill-trading register` — the CLI generates an email + passkey, creates wallets, and writes `.env`. Back up the passkey immediately.
4. The agent asks which exchange you want to trade on and collects API credentials in chat — they're written to `.env` for that exchange
5. `skill-trading status` is re-run to confirm `READY` before any trading

All order mutations run against live exchanges. The agent confirms before executing and supports `--dry-run` on every mutation.

## Setup

After deploying, open the chat. The agent walks through:

1. Status check — is the Tetrac session valid and is an exchange configured?
2. Authentication (first run only) — `skill-trading register` auto-generates credentials and writes `.env`
3. Exchange selection — pick from 15+ supported exchanges
4. API credentials — paste API key, secret, and passphrase (where required); agent writes to `.env`
5. `skill-trading status` → confirm `READY`

### Required secrets

None at deploy time. All credentials are collected in chat and written to `.env` by the CLI. See the [Tetrac CLI README](https://gitlab.com/tradingtoolcrypto/rust-cli-ttc-api/-/blob/main/README.md) for the full list of exchange env-var names.

## Supported exchanges

`orderly`, `phemex`, `bybit`, `binance`, `okx`, `bitget`, `blofin`, `kucoin`, `hyperliquid`, `asterdex`, `bingx` — and more. Some exchanges require a passphrase (Orderly, OKX, KuCoin, Bitget, BloFin).

## Powered by

- [Tetrac skill-trading CLI](https://gitlab.com/tradingtoolcrypto/rust-cli-ttc-api) — Rust binary, 11 installable skills
- [TTC Box](https://ttc.box) — session auth and market data aggregation
