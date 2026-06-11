# TOOLS.md — multiclaw-vault Cheat Sheet

## Running commands

```bash
cd workspace/skills/multiclaw-vault
npm run mc -- <command>
```

Full reference: `skills/multiclaw-vault/SKILL.md`.

## Commands

| Command                                   | What it does                                                                                                 |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `budget`                                  | Remaining allowance for the current window, the cap, % used. Also prints your agent address.                 |
| `status`                                  | Vault state: paused, Safe, oracle mode, authorized agents.                                                   |
| `history`                                 | Recent executions + transfers for this agent (needs `SUBGRAPH_URL`).                                         |
| `whitelist [recipient...]`                | Whitelist enforcement + membership; with `SUBGRAPH_URL`, full allowed set + `ownerIsSoleRecipient`.          |
| `acquired <token>`                        | Acquired (free-to-spend) balance for a token.                                                                |
| `transfer <token> <recipient> <amount>`   | Send `amount` (base units) to `recipient`. Reverts on cap breach or non-whitelisted recipient.               |
| `execute <target> <call> [--value <wei>]` | Call a DeFi protocol within the same guardrails. `<call>` = raw `0x…` calldata or `"funcSig(types)"` + args. |

## Protocol calls (`execute`)

The vault resolves the parser registered for `<target>` on-chain and validates the call. The target must be whitelisted on the vault (`allowedAddresses`) or the call reverts; caps and recipient checks still apply.

| Protocol                        | Typical calls                                                                               | Form         |
| ------------------------------- | ------------------------------------------------------------------------------------------- | ------------ |
| Aave V3                         | `supply(address,uint256,address,uint16)`, `withdraw(address,uint256,address)`, `repay(...)` | signature    |
| Morpho (ERC-4626)               | `deposit(uint256,address)`, `withdraw(uint256,address,address)`, `redeem(...)`              | signature    |
| Morpho Blue                     | supply/withdraw/repay (MarketParams tuple)                                                  | raw calldata |
| Uniswap V3/V4, Universal Router | `exactInputSingle(...)`, packed commands                                                    | raw calldata |
| 1inch, Paraswap, KyberSwap      | aggregator swaps — their quote APIs hand you ready calldata                                 | raw calldata |
| Merkl                           | `claim(...)`                                                                                | raw calldata |

- **Signature form** for scalar args (addresses, uints, bools); amounts in base units; uints accept decimal strings.
- **Raw calldata form** for tuples/arrays/packed bytes — pass aggregator quote-API calldata straight through.

Emergency withdrawal pattern (circuit breaker): `execute` the protocol's `withdraw`/`redeem` to the Safe, then `transfer` the tokens to `OWNER_ADDRESS`.

## Environment

| Var                    | Required | Notes                                                               |
| ---------------------- | -------- | ------------------------------------------------------------------- |
| `AGENT_PRIVATE_KEY`    | yes      | Your signer. Never echo it.                                         |
| `VAULT_MODULE_ADDRESS` | yes      | The DeFiInteractorModule you operate.                               |
| `OWNER_ADDRESS`        | yes      | Circuit-breaker destination; `whitelist` checks it by default.      |
| `MULTICLAW_CHAIN`      | no       | `base` (default) or `baseSepolia` (rehearsal only).                 |
| `RPC_URL`              | no       | Defaults to `https://mainnet.base.org`.                             |
| `SUBGRAPH_URL`         | no       | Enables `history` + whitelist enumeration. Read-only, not a secret. |

## Addresses (reference)

- AgentVaultFactory (Base mainnet): `0x389623997Bc006dA3BdBbE18d7Be04dACF4f09Ff`
- AgentVaultFactory (Base Sepolia): `0xa4D6FdE6f8F6f873BB00d5059541B657468E6179`
- Vault creation wizard: https://app.multiclaws.xyz

## Notes

Add environment-specific details as you discover them:

- Protocol targets whitelisted on this vault (ask the owner, or learn from reverts)
- Tokens the owner trades and their decimals
- Subgraph endpoint quirks, RPC rate limits
