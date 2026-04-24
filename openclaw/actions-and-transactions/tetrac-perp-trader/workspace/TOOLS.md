# TOOLS.md — Environment Notes

## skill-trading CLI

- **Binary path:** `$HOME/.skill-trading/bin/skill-trading` (also linked to `/usr/local/bin/skill-trading` when writable)
- **Installed by:** `setup.sh` at build time — clones `https://gitlab.com/tradingtoolcrypto/rust-cli-ttc-api` and copies the prebuilt platform binary.
- **Version check:** `skill-trading info`
- **Help:** `skill-trading <command> --help`
- **Output formats:** append `--output-format json|table|csv|quiet` to any command
- **Dry-run:** append `--dry-run` to any mutation to preview without executing
- **Verbose:** `-v` for debug logs

## Key command groups

| Group | What it does |
|-------|-------------|
| `skill-trading status` | Pre-flight: TTC Box API + session + exchange credentials → READY / NOT READY |
| `skill-trading register / login` | Auth — register auto-generates email + passkey and writes .env |
| `skill-trading order` | limit, market, stop, take-profit, dca, open, cancel, cancel-all |
| `skill-trading position` | get, pnl, close, close-all |
| `skill-trading account` | balance, leverage, margin, hedge |
| `skill-trading risk` | sl, tp, trail, trail-watch |
| `skill-trading market` | hybrid-tickers, funding-rates, open-interest, volume-snapshot, scanner, alert, tickers, best-bid-ask |
| `skill-trading portfolio summary` | Balance + positions → HEALTHY / WATCH / DANGER |
| `skill-trading brief` | Morning briefing (status + watchlist + scanner + portfolio + open orders) |
| `skill-trading twap / twap-slice` | Unattended TWAP loop / single atomic slice for /loop |
| `skill-trading market-maker` | Limit-order spread-capture loop |
| `skill-trading config` | init, show, path, set-default, add-exchange, rm-exchange |

## Command Aliases

| Full | Aliases |
|------|---------|
| `position` | `positions`, `pos` |
| `portfolio` | `port`, `pf` |
| `market` | `m` |
| `market-maker` | `mm` |
| `brief` | `morning`, `mb` |
| `order open` | `order list`, `order ls` |
| `market scanner` | `market scan` |
| `market hybrid-tickers` | `market ht`, `market agg` |
| `market funding-rates` | `market fr`, `market funding` |
| `market open-interest` | `market oi` |

## Environment Variables (.env)

**TTC session** — written automatically by `register` / `login`:
- `TTC_AUTH_TOKEN`, `TTC_PUBLIC_KEY`, `TTC_EMAIL`, `TTC_PASSKEY`, `TTC_TOKEN_ISSUED_AT`, `TTC_EXCHANGE`

**Exchange credentials** — added during onboarding (names vary by exchange, see `openclaw/skill-onboarding/SKILL.md`):
- `<EXCHANGE>_API_KEY`
- `<EXCHANGE>_API_SECRET`
- `<EXCHANGE>_API_PASSPHRASE` (Orderly, OKX, KuCoin, Bitget, BloFin)
- `ORDERLY_MAIN_WALLET_ADDRESS` (required for email-registered Orderly users)

**Per-command overrides:** every env var has a matching CLI flag — see `skill-trading --help`.

## Supported Exchanges

`orderly`, `phemex`, `bybit`, `binance`, `okx`, `bitget`, `blofin`, `kucoin`, `hyperliquid`, `asterdex`, `bingx`, and more. See `openclaw/skill-onboarding/SKILL.md` for the authoritative list.

## Skills Location

After build: `openclaw/<skill-name>/SKILL.md` at the repo root (one folder per skill, each self-contained with references and examples).

## Session Token Lifetime

- TTC session tokens expire after **24 hours**.
- `skill-trading status` reports exact time remaining.
- When expired, run `skill-trading login` (reads email + passkey from `.env`) to refresh.

## Configuration Priority

1. CLI flags
2. Environment variables / `.env`
3. `config.toml` (in CWD or `~/Library/Application Support/com.ttcbox.skill-trading/config.toml` on macOS)
4. Built-in defaults

## Notes

Add environment-specific details here as you discover them:
- Which exchange the user settled on
- Any rate limits hit
- Preferred leverage, margin mode, hedge-mode setting
- Custom portfolio thresholds in `config.toml` (`max_margin_utilization`, `min_liq_distance_pct`, `max_position_notional`)
