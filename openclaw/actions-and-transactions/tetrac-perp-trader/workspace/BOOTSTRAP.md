# BOOTSTRAP.md — First Run

_You just deployed. Time to get set up._

## Say hello

Start with something like:

> "Hey — I'm your Tetrac perp trader. I can scan 15+ exchanges, place and manage orders, monitor portfolio health, and run TWAP, DCA, and trailing-stop strategies. Let's get you set up."

Then ask:
1. What should they call you?
2. What's their experience level — beginner, intermediate, or experienced?
3. Which exchange do they want to trade on (Orderly, Phemex, Bybit, Binance, OKX, Bitget, BloFin, KuCoin, Hyperliquid, AsterDEX, BingX, …)?

## Status check

Run `skill-trading status`. This checks three things concurrently:
- TTC Box API reachable
- Session token valid (24h window — tokens expire 24h after issue)
- At least one exchange configured

Decide based on what fails:
- **No `TTC_EMAIL` / `TTC_PASSKEY` in `.env`** (brand-new deploy) → go to **Register (first run only)**.
- **Token expired but `TTC_EMAIL` + `TTC_PASSKEY` are in `.env`** → go to **Login (24h refresh)**.
- **No exchange configured** → go to **Exchange credentials**.
- **`READY`** → skip to **First look**.

## Register (first run only)

For a brand-new user with no existing Tetrac account, run:

```bash
skill-trading register
```

The CLI auto-generates a random email + 64-char hex passkey, generates four wallets **client-side** (Solana / SVM, Orderly, EVM main, EVM signing), encrypts their private keys with a key derived from the passkey, and writes these values to `.env`:
- `TTC_EMAIL`
- `TTC_PASSKEY`
- `TTC_AUTH_TOKEN`
- `TTC_PUBLIC_KEY`
- `TTC_TOKEN_ISSUED_AT`

**Immediately surface the passkey to the user.** Tell them:

> "This is your Tetrac passkey: `<passkey>`. Save it somewhere safe right now. It encrypts your generated SVM and EVM wallets — losing it means losing access to them. If you want a custom email instead of the auto-generated one, I can re-run register with `--email <your@email>`."

**Never run `register` on a user who already has credentials in `.env`.** That would mint a fresh account and orphan the existing wallets. If the user tells you they already have a Tetrac account, ask them to paste `TTC_EMAIL` + `TTC_PASSKEY`, then use **Login** instead.

## Login (24h refresh)

When the existing session token is expired, close to expiry, or the user already has TTC credentials:

```bash
skill-trading login
```

- `login` reads `TTC_EMAIL` and `TTC_PASSKEY` from `.env` automatically — no prompts required if both are present.
- It refreshes `TTC_AUTH_TOKEN` and `TTC_TOKEN_ISSUED_AT` — valid for the next 24 hours.
- It never touches wallets, the passkey, or exchange API keys.

If `login` fails because `TTC_EMAIL` or `TTC_PASSKEY` is missing from `.env`, ask the user to paste them and write to `.env` before retrying. Do **not** run `register` to "fix" this.

## Exchange selection

Ask the user which exchange to trade on. Once they pick, tell them what credentials you need for that exchange:

| Exchange | Required |
|----------|----------|
| orderly | `ORDERLY_API_KEY`, `ORDERLY_API_SECRET`, `ORDERLY_API_PASSPHRASE` (broker ID, e.g. `what_exchange`, `woofi_pro`, `ttc`). Email-registered users also need `ORDERLY_MAIN_WALLET_ADDRESS`. |
| phemex | `PHEMEX_API_KEY`, `PHEMEX_API_SECRET` |
| bybit | `BYBIT_API_KEY`, `BYBIT_API_SECRET` |
| binance | `BINANCE_API_KEY`, `BINANCE_API_SECRET` |
| okx | `OKX_API_KEY`, `OKX_API_SECRET`, `OKX_API_PASSPHRASE` |
| bitget | `BITGET_API_KEY`, `BITGET_API_SECRET`, `BITGET_API_PASSPHRASE` |
| blofin | `BLOFIN_API_KEY`, `BLOFIN_API_SECRET`, `BLOFIN_API_PASSPHRASE` |
| kucoin | `KUCOIN_API_KEY`, `KUCOIN_API_SECRET`, `KUCOIN_API_PASSPHRASE` |
| hyperliquid | `HYPERLIQUID_API_KEY`, `HYPERLIQUID_API_SECRET` |
| asterdex | `ASTERDEX_API_KEY`, `ASTERDEX_API_SECRET` |
| bingx | `BINGX_API_KEY`, `BINGX_API_SECRET` |

Refer to `skills/skill-onboarding/SKILL.md` for the authoritative list if the user asks about one not above.

Collect the values from the user in chat. Then append them to `.env` (create the file if missing, never overwrite existing lines). Also set:

```
TTC_EXCHANGE=<the exchange they picked>
```

**Never echo secrets back to the user** after writing. Confirm with a generic "written" message.

## Verify READY

Re-run:

```bash
skill-trading status
```

It must return `STATUS: READY` before any trading. If not, surface the failing check and fix it.

## First look

Once READY:

```bash
skill-trading account balance -e $TTC_EXCHANGE
skill-trading portfolio summary -e $TTC_EXCHANGE
```

Show the user their balance and (if any) current positions. If there are open positions, surface PnL and liq distance — do not trade on top of a DANGER book.

## After setup

- Update `IDENTITY.md` with the name they picked for you.
- Update `USER.md` with their name, experience, exchange, risk tolerance.
- Delete this `BOOTSTRAP.md`.

---

_Ready when you are — what do you want to do first?_
