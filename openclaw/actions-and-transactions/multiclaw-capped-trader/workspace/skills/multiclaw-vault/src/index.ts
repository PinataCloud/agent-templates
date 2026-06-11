import { formatUnits, isAddress, isHex, type Address, type Hex } from "viem";
import { loadContext } from "./client.js";
import { encodeCall } from "./protocols.js";
import {
  fetchHistory,
  fetchAllowedRecipients,
  type ProtocolExecutionRow,
  type TransferExecutedRow,
} from "./subgraph.js";

const USD_DECIMALS = 18;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Format an 18-decimal USD bigint for display. */
function usd(value: bigint): string {
  const n = Number(formatUnits(value, USD_DECIMALS));
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function emit(obj: Record<string, unknown>): void {
  console.log(JSON.stringify(obj, null, 2));
}

async function budget(): Promise<void> {
  const { client, agent, module } = loadContext();
  const b = await client.getRemainingBudget(module, agent.address);
  emit({
    agent: agent.address,
    module,
    remaining: usd(b.remainingAllowance),
    cap: usd(b.maxAllowance),
    spentThisWindow: usd(b.cumulativeSpent),
    usedPercentage: b.usedPercentage,
    windowSeconds: Number(b.windowDuration),
    oraclelessMode: b.oracleless,
    windowExpired: b.windowExpired,
  });
}

async function status(): Promise<void> {
  const { client, module } = loadContext();
  const s = await client.getVaultStatus(module);
  emit({
    module: s.module,
    safe: s.safe,
    paused: s.isPaused,
    oracle: s.oracle,
    oraclelessMode: s.oracle.toLowerCase() === ZERO_ADDRESS,
    safeValueUSD: usd(s.safeValueUSD),
    executeAgents: s.executeAgents,
    transferAgents: s.transferAgents,
  });
}

async function history(): Promise<void> {
  const subgraphUrl = process.env.SUBGRAPH_URL;
  if (!subgraphUrl) {
    throw new Error(
      "Missing required env var: SUBGRAPH_URL (your MultiClaw subgraph query URL)",
    );
  }
  const { agent } = loadContext();
  const data = await fetchHistory(subgraphUrl, agent.address);
  emit({
    executions: data.protocolExecutions.map((e: ProtocolExecutionRow) => ({
      target: e.target,
      opType: Number(e.opType),
      spendingCost: usd(BigInt(e.spendingCost)),
      block: Number(e.blockNumber),
      txHash: e.transactionHash,
    })),
    transfers: data.transferExecuteds.map((t: TransferExecutedRow) => ({
      token: t.token,
      recipient: t.recipient,
      amount: t.amount,
      spendingCost: usd(BigInt(t.spendingCost)),
      block: Number(t.blockNumber),
      txHash: t.transactionHash,
    })),
  });
}

async function whitelist(args: string[]): Promise<void> {
  const { client, agent, module } = loadContext();

  // Check the recipients passed as args, or fall back to OWNER_ADDRESS — the
  // address a guardian must confirm it can (only) withdraw to.
  const owner = process.env.OWNER_ADDRESS;
  const toCheck = args.filter((a) => isAddress(a)) as Address[];
  if (toCheck.length === 0 && owner && isAddress(owner)) {
    toCheck.push(owner as Address);
  }

  const wl = await client.getRecipientWhitelist(module, agent.address, toCheck);

  const out: Record<string, unknown> = {
    agent: agent.address,
    module,
    enabled: wl.enabled,
    checked: wl.allowed,
  };

  // Enumerate the full current set from the subgraph when available, and
  // compute the guardian invariant: whitelist on AND owner the sole recipient.
  const subgraphUrl = process.env.SUBGRAPH_URL;
  if (subgraphUrl) {
    const allowed = await fetchAllowedRecipients(subgraphUrl, agent.address);
    out.allowedRecipients = allowed;
    if (owner && isAddress(owner)) {
      out.ownerIsSoleRecipient =
        wl.enabled &&
        allowed.length === 1 &&
        allowed[0] === owner.toLowerCase();
    }
  }

  emit(out);
}

async function acquired(args: string[]): Promise<void> {
  const [token] = args;
  if (!token || !isAddress(token)) {
    throw new Error("Usage: acquired <token>");
  }
  const { client, agent, module } = loadContext();
  const balance = await client.getAcquiredBalance(
    module,
    agent.address,
    token as Address,
  );
  emit({ token, acquired: balance.toString() });
}

async function execute(rawArgs: string[]): Promise<void> {
  // Optional `--value <wei>` for protocol calls that send native ETH.
  let value = 0n;
  let args = rawArgs;
  const vi = args.indexOf("--value");
  if (vi !== -1) {
    const v = args[vi + 1];
    if (!v) throw new Error("--value requires a wei amount");
    value = BigInt(v);
    args = [...args.slice(0, vi), ...args.slice(vi + 2)];
  }

  const [target, sigOrData, ...callArgs] = args;
  if (!target || !isAddress(target)) {
    throw new Error(
      'Usage: execute <target> <0xcalldata | "funcSig(types)" args...> [--value <wei>]',
    );
  }
  if (!sigOrData) {
    throw new Error("Provide raw 0x calldata, or a function signature + args");
  }

  // Raw calldata (no extra args) passes through; otherwise treat the token as a
  // function signature and ABI-encode it with the remaining args.
  const data: Hex =
    isHex(sigOrData) && callArgs.length === 0
      ? sigOrData
      : encodeCall(sigOrData, callArgs);

  const { client, agent, module } = loadContext();
  const { txHash, receipt } =
    value > 0n
      ? await client.executeAsAgentWithValue(
          module,
          target as Address,
          data,
          value,
          agent,
        )
      : await client.executeAsAgent(module, target as Address, data, agent);

  emit({
    status: receipt.status,
    txHash,
    target,
    value: value.toString(),
    note:
      receipt.status === "reverted"
        ? "Execution reverted on-chain — target not whitelisted, unsupported selector, spending-cap breach, or the protocol call itself failed."
        : "Execution confirmed within the on-chain guardrails.",
  });
}

async function transfer(args: string[]): Promise<void> {
  const [token, recipient, amount] = args;
  if (!token || !recipient || !amount) {
    throw new Error("Usage: transfer <token> <recipient> <amount(base units)>");
  }
  if (!isAddress(token) || !isAddress(recipient)) {
    throw new Error("token and recipient must be valid addresses");
  }

  const { client, agent, module } = loadContext();
  const { txHash, receipt } = await client.transferAsAgent(
    module,
    token as Address,
    recipient as Address,
    BigInt(amount),
    agent,
  );

  emit({
    status: receipt.status,
    txHash,
    note:
      receipt.status === "reverted"
        ? "Transfer reverted on-chain — likely a spending-cap breach or non-whitelisted recipient."
        : "Transfer confirmed within the on-chain cap.",
  });
}

async function main(): Promise<void> {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "budget":
      return budget();
    case "status":
      return status();
    case "history":
      return history();
    case "whitelist":
      return whitelist(rest);
    case "acquired":
      return acquired(rest);
    case "transfer":
      return transfer(rest);
    case "execute":
      return execute(rest);
    default:
      console.log(
        'Commands: budget | status | history | whitelist [recipient...] | acquired <token> | transfer <token> <recipient> <amount> | execute <target> <0xcalldata | "funcSig" args...> [--value <wei>]',
      );
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[multiclaw-vault] error: ${message}`);
  process.exitCode = 1;
});
