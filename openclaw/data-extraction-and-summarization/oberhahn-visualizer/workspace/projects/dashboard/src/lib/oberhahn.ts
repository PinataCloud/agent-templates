// Server-only module: this is the one place the API key is ever read.

export function ledgerUrl(): string {
  const url = process.env.OBERHAHN_URL || 'https://app.oberhahn.com'
  return url.replace(/\/+$/, '')
}

export function hasKey(): boolean {
  const key = process.env.OBERHAHN_API_KEY
  return typeof key === 'string' && key.length > 0
}

/**
 * `path` must already start with `/v0/` and `search` is the raw query string
 * (with or without a leading `?`). Reads process.env lazily on every call
 * rather than caching it at module load, since the key is injected into the
 * container's environment and may not exist yet at import time.
 */
export async function fetchLedger(path: string, search: string): Promise<Response> {
  const key = process.env.OBERHAHN_API_KEY ?? ''
  const query = search ? (search.startsWith('?') ? search : `?${search}`) : ''
  const url = `${ledgerUrl()}${path}${query}`
  return fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${key}`,
    },
  })
}
