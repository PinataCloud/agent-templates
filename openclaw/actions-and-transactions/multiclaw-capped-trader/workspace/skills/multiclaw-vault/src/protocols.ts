import { encodeFunctionData, parseAbiItem, type Hex } from "viem";

/**
 * Encode a protocol call from a human-readable function signature + CLI string
 * args, coercing each arg to its ABI input type. This is protocol-agnostic — it
 * works for any function on any target, so the on-chain parser registered for
 * that target validates the result. Use it for scalar-argument functions
 * (Aave `supply`/`withdraw`/`repay`, Morpho ERC-4626 `deposit`/`withdraw`/
 * `redeem`, etc.).
 *
 * For functions taking tuples/arrays/packed bytes (Uniswap `exactInputSingle`,
 * Morpho Blue `MarketParams`, the Universal Router, or 1inch/Paraswap/KyberSwap
 * aggregator calldata), build the calldata off-skill and pass it to `execute` as
 * raw `0x…` hex instead.
 */
export function encodeCall(signature: string, rawArgs: string[]): Hex {
  const item = parseAbiItem(`function ${signature}`);
  if (item.type !== "function") {
    throw new Error(`Not a function signature: "${signature}"`);
  }
  const inputs = item.inputs ?? [];
  if (rawArgs.length !== inputs.length) {
    throw new Error(
      `${item.name}() expects ${inputs.length} argument(s), got ${rawArgs.length}`,
    );
  }
  const args = inputs.map((input, i) => coerce(input.type, rawArgs[i]));
  return encodeFunctionData({ abi: [item], functionName: item.name, args });
}

/** Coerce a CLI string into the value type its ABI parameter expects. */
function coerce(type: string, value: string): string | bigint | boolean {
  // Reject arrays/tuples first — before the scalar prefix checks, so e.g.
  // "uint256[]" isn't mistaken for a "uint" scalar.
  if (type.endsWith("[]") || type.startsWith("tuple") || type.startsWith("(")) {
    throw new Error(
      `Argument type "${type}" (array/tuple) is not supported via the signature form — ` +
        `build the calldata and pass it as raw 0x… hex instead.`,
    );
  }
  if (type.startsWith("uint") || type.startsWith("int")) return BigInt(value);
  if (type === "bool") return value === "true";
  return value; // address, bytes, bytesN, string pass through unchanged
}
