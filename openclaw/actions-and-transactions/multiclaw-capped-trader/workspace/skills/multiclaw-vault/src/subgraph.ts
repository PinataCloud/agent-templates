import type { Address } from "viem";

/**
 * Subgraph-backed reads. Queries MultiClaw subgraph entities for a given agent
 * (subAccount). The Graph stores addresses as lowercase Bytes, so any
 * `subAccount`/recipient filter must be lowercased.
 */

interface GraphQLResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

/** POST a GraphQL query and return its `data`, throwing on HTTP/GraphQL errors. */
async function postGraphQL<T>(
  subgraphUrl: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(subgraphUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`Subgraph HTTP ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors && json.errors.length > 0) {
    throw new Error(
      `Subgraph query error: ${json.errors.map((e) => e.message).join("; ")}`,
    );
  }
  if (!json.data) {
    throw new Error("Subgraph returned no data");
  }
  return json.data;
}

// ============ History ============

const HISTORY_QUERY = `query History($agent: Bytes!, $first: Int!) {
  protocolExecutions(
    where: { subAccount: $agent }
    orderBy: blockNumber
    orderDirection: desc
    first: $first
  ) {
    target
    opType
    spendingCost
    blockNumber
    transactionHash
  }
  transferExecuteds(
    where: { subAccount: $agent }
    orderBy: blockNumber
    orderDirection: desc
    first: $first
  ) {
    token
    recipient
    amount
    spendingCost
    blockNumber
    transactionHash
  }
}`;

export interface ProtocolExecutionRow {
  target: string;
  opType: number;
  spendingCost: string;
  blockNumber: string;
  transactionHash: string;
}

export interface TransferExecutedRow {
  token: string;
  recipient: string;
  amount: string;
  spendingCost: string;
  blockNumber: string;
  transactionHash: string;
}

export interface HistoryResult {
  protocolExecutions: ProtocolExecutionRow[];
  transferExecuteds: TransferExecutedRow[];
}

export async function fetchHistory(
  subgraphUrl: string,
  agent: Address,
  first = 50,
): Promise<HistoryResult> {
  return postGraphQL<HistoryResult>(subgraphUrl, HISTORY_QUERY, {
    agent: agent.toLowerCase(),
    first,
  });
}

// ============ Recipient whitelist ============

const ALLOWED_RECIPIENTS_QUERY = `query Whitelist($agent: Bytes!, $first: Int!) {
  allowedRecipientsSets(
    where: { subAccount: $agent }
    orderBy: blockNumber
    orderDirection: asc
    first: $first
  ) {
    recipients
    allowed
    blockNumber
  }
}`;

interface AllowedRecipientsSetRow {
  recipients: string[];
  allowed: boolean;
  blockNumber: string;
}

/**
 * Reconstruct an agent's *current* allowed-recipient set from
 * `AllowedRecipientsSet` events. Each event toggles a batch of recipients on or
 * off; replaying them in block order yields the live set. Returns lowercased
 * addresses. (The on-chain mapping isn't enumerable, so this is the only way to
 * list the whole set rather than checking known addresses one by one.)
 */
export async function fetchAllowedRecipients(
  subgraphUrl: string,
  agent: Address,
  first = 1000,
): Promise<string[]> {
  const data = await postGraphQL<{
    allowedRecipientsSets: AllowedRecipientsSetRow[];
  }>(subgraphUrl, ALLOWED_RECIPIENTS_QUERY, {
    agent: agent.toLowerCase(),
    first,
  });

  const state = new Map<string, boolean>();
  for (const row of data.allowedRecipientsSets) {
    for (const recipient of row.recipients) {
      state.set(recipient.toLowerCase(), row.allowed);
    }
  }
  return [...state.entries()].filter(([, on]) => on).map(([r]) => r);
}
