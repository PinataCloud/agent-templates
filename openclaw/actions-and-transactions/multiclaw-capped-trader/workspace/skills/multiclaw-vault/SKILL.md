---
name: multiclaw-vault
description: Operate a MultiClaw vault on Base — read budget/status/history/whitelist, make capped whitelist-checked transfers, and call DeFi protocols (Aave, Morpho, Uniswap, 1inch, Paraswap, KyberSwap, Merkl) via executeOnProtocol. Every action is bounded by on-chain guardrails.
---

# MultiClaw Vault skill

This skill lets you operate a MultiClaw agent vault: read its on-chain spending
state and move tokens within the contract-enforced cap. It wraps the
`@multiclaw/core` SDK.

All commands run from this folder via `npm run mc -- <command>`.

## Commands

| Command                                   | What it does                                                                                                                                                                                 |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `budget`                                  | Remaining spending allowance for the current window, the cap, and % used.                                                                                                                    |
| `status`                                  | Vault state: paused, Safe, oracle (oracleless?), Safe value, authorized agents.                                                                                                              |
| `history`                                 | Recent protocol executions and transfers for this agent (read from the subgraph; needs `SUBGRAPH_URL`).                                                                                      |
| `whitelist [recipient...]`                | Recipient whitelist: whether it's enforced, membership for the given recipients (or `OWNER_ADDRESS`), and — with `SUBGRAPH_URL` — the full allowed set plus `ownerIsSoleRecipient`.          |
| `acquired <token>`                        | Acquired (free-to-spend) balance for a token.                                                                                                                                                |
| `transfer <token> <recipient> <amount>`   | Send `amount` (base units) of `token` to `recipient`. Reverts on cap breach or non-whitelisted recipient.                                                                                    |
| `execute <target> <call> [--value <wei>]` | Call a DeFi protocol (swap, deposit, withdraw, repay, claim) within the same on-chain guardrails. `<call>` is either raw `0x…` calldata or a `"funcSig(types)"` string followed by its args. |

Examples:

```
npm run mc -- budget
npm run mc -- status
npm run mc -- transfer 0xToken... 0xRecipient... 1000000

# protocol calls — signature form (scalar args), or raw calldata
npm run mc -- execute 0xAavePool "withdraw(address,uint256,address)" 0xAsset 1000000 0xSafe
npm run mc -- execute 0xMorphoVault "redeem(uint256,address,address)" 5000000 0xSafe 0xSafe
npm run mc -- execute 0xUniRouter 0xabcdef...   # prebuilt calldata for complex/struct calls
```

## Protocols (`execute`)

`execute` is protocol-agnostic: the vault resolves the parser registered for
`<target>` on-chain and validates the call, so the same command drives every
protocol MultiClaw supports. The target must be **whitelisted** on the vault
(`allowedAddresses`) or the call reverts; spending caps and recipient checks
still apply, exactly as for `transfer`.

| Protocol                        | Typical calls                                                                                                           | Form         |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------ |
| Aave V3                         | `supply(address,uint256,address,uint16)`, `withdraw(address,uint256,address)`, `repay(address,uint256,uint256,address)` | signature    |
| Morpho (ERC-4626)               | `deposit(uint256,address)`, `withdraw(uint256,address,address)`, `redeem(uint256,address,address)`                      | signature    |
| Morpho Blue                     | supply/withdraw/repay (take a `MarketParams` tuple)                                                                     | raw calldata |
| Uniswap V3/V4, Universal Router | `exactInputSingle(...)` / packed commands                                                                               | raw calldata |
| 1inch, Paraswap, KyberSwap      | aggregator swaps (from their quote APIs)                                                                                | raw calldata |
| Merkl                           | `claim(...)`                                                                                                            | raw calldata |

- **Signature form** (`"funcSig(types)" args…`) — for scalar arguments
  (addresses, uints, bools). Amounts are base units; uints accept decimal
  strings.
- **Raw calldata form** (`0x…`) — for tuples/arrays/packed bytes. Aggregators
  (1inch/Paraswap/KyberSwap) already hand you ready-to-send calldata from their
  quote APIs; pass it straight through.

## Rules for the agent

- **The cap is a hard law.** Always run `budget` before a `transfer` or a
  spend-bearing `execute`. Never attempt an amount that exceeds `remaining` — it
  will revert and waste gas, and it violates your operating contract.
- **`execute` targets must be whitelisted.** If `execute` reverts with a
  target/address error, the protocol isn't allowed on this vault. Report it to
  the owner; do not try other targets.
- **Whitelist.** If a transfer reverts with a recipient error, the recipient is
  not whitelisted. Report this to the owner; do not retry against other targets.
- A reverted transaction returns `status: "reverted"`. Treat that as a hard stop,
  read the error, and explain it — do not loop.
- Amounts are in the token's **base units** (e.g. 6-decimal USDC: `1000000` = 1
  USDC). Convert carefully.

## Security

- This skill folder is pinned to public IPFS. It contains **no secrets** — the
  agent key and RPC come from environment variables at runtime.
- Never echo `AGENT_PRIVATE_KEY` or any secret into output, files, or logs.

## Configuration

See `.env.example` for required environment variables.
