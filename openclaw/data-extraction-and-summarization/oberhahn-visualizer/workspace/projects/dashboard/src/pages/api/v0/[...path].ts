import type { APIRoute } from 'astro'
import { fetchLedger, hasKey } from '../../../lib/oberhahn'

export const prerender = false

const NOT_PROXIED_BODY = JSON.stringify({
  error: 'not-proxied',
  message: 'Only GET requests to /api/v0/* are proxied to the oberhahn ledger.',
})

function notProxied(): Response {
  return new Response(NOT_PROXIED_BODY, {
    status: 405,
    headers: { 'content-type': 'application/json' },
  })
}

export const GET: APIRoute = async ({ params, url }) => {
  const path = `/v0/${params.path ?? ''}`

  if (!hasKey()) {
    // this exact shape is what client.ts checks to fall back to demo mode
    return new Response(
      JSON.stringify({
        error: 'no-key',
        demo: true,
        message: 'OBERHAHN_API_KEY is not set on the server — falling back to demo mode.',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    )
  }

  let upstream: Response
  try {
    upstream = await fetchLedger(path, url.search)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'upstream', detail: err instanceof Error ? err.message : String(err) }),
      { status: 502, headers: { 'content-type': 'application/json' } },
    )
  }

  // pass the upstream status through as-is — a bad key should surface as a
  // 401 here, not get swallowed into a generic 500
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}

export const POST: APIRoute = async () => notProxied()
export const PUT: APIRoute = async () => notProxied()
export const PATCH: APIRoute = async () => notProxied()
export const DELETE: APIRoute = async () => notProxied()
export const HEAD: APIRoute = async () => notProxied()
export const OPTIONS: APIRoute = async () => notProxied()
export const ALL: APIRoute = async () => notProxied()
