import { MultiClawClient } from "@multiclaw/core";
import { privateKeyToAccount } from "viem/accounts";
import type { Account, Address, Hex } from "viem";

export interface SkillContext {
  readonly client: MultiClawClient;
  readonly agent: Account;
  readonly module: Address;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

/**
 * Build the skill context — chain client, agent signer, and module address —
 * from environment variables. Throws if a required var is missing.
 */
export function loadContext(): SkillContext {
  const chain = (process.env.MULTICLAW_CHAIN ?? "base") as
    | "base"
    | "baseSepolia";
  const rpcUrl = process.env.RPC_URL;

  const agent = privateKeyToAccount(requireEnv("AGENT_PRIVATE_KEY") as Hex);
  const moduleAddress = requireEnv("VAULT_MODULE_ADDRESS") as Address;

  const client = new MultiClawClient(rpcUrl ? { chain, rpcUrl } : { chain });

  return { client, agent, module: moduleAddress };
}
