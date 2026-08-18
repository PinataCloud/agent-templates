import type { OberEvent, Tokens } from './types'

interface RawCustom {
  signal?: unknown
  test_event?: unknown
  issue_project?: unknown
  task_project?: unknown
  issue_team?: unknown
  task_team?: unknown
  cost_unknown?: unknown
  unpriced_model?: unknown
  session_title?: unknown
  task_title?: unknown
  agent_name?: unknown
  unattended?: unknown
  prompt_turn?: unknown
  tools?: unknown
  gen_ms?: unknown
  git_repo?: unknown
  git_branch?: unknown
  lines_added?: unknown
  lines_removed?: unknown
  agent_commits?: unknown
  agent_pushes?: unknown
  pr_opened?: unknown
  tool_errors?: unknown
  tools_denied?: unknown
  api_error?: unknown
  permission_mode?: unknown
  tool_ms?: unknown
}

interface RawSpendDetails {
  model?: unknown
  input_tokens?: unknown
  output_tokens?: unknown
  cache_read_tokens?: unknown
  cache_write_tokens?: unknown
}

interface RawEvent {
  date?: unknown
  consumer_id?: unknown
  cost?: unknown
  source?: unknown
  provider_session_id?: unknown
  custom?: unknown
  spend_details?: unknown
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// `Number(v) || null` semantics: NaN and 0 both fall through to null
function numOrNullFalsy(v: unknown): number | null {
  const n = Number(v)
  return n ? n : null
}

// null only when the raw field itself is absent; NaN still normalizes to 0
function turnValue(v: unknown): number | null {
  if (v === undefined || v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function boolish(v: unknown): boolean {
  return v === 'true' || v === true
}

// present-but-non-null is the signal for costUnknown, independent of its actual value
function present(v: unknown): boolean {
  return v !== undefined && v !== null
}

export function normalize(rows: unknown[]): OberEvent[] {
  const out: OberEvent[] = []

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue
    const e = row as RawEvent
    const c = (e.custom && typeof e.custom === 'object' ? e.custom : {}) as RawCustom
    const s = (e.spend_details && typeof e.spend_details === 'object' ? e.spend_details : {}) as RawSpendDetails

    // hygiene: drop notification/test/setup rows before any chart can see them
    if (present(c.signal)) continue
    if (present(c.test_event)) continue
    if (e.consumer_id === 'oberhahn-setup-test') continue

    const time = Date.parse(String(e.date ?? ''))
    if (!Number.isFinite(time)) continue

    const tokens: Tokens = {
      input: num(s.input_tokens),
      output: num(s.output_tokens),
      cacheRead: num(s.cache_read_tokens),
      cacheWrite: num(s.cache_write_tokens),
    }

    out.push({
      time,
      user: str(e.consumer_id) ?? 'unknown',
      // mid-2026 rename: issue_* replaced task_*; read the new name first so
      // archived exports don't silently collapse project to Unassigned
      project: str(c.issue_project) ?? str(c.task_project) ?? 'Unassigned',
      team: str(c.issue_team) ?? str(c.task_team) ?? null,
      cost: num(e.cost),
      // cost_unknown / unpriced_model mean "real spend, unknown dollars" —
      // never collapse this into cost === 0
      costUnknown: present(c.cost_unknown) || present(c.unpriced_model),
      source: str(e.source) ?? 'unknown',
      model: str(s.model),
      title: str(c.session_title) ?? str(c.task_title),
      session: str(e.provider_session_id),
      agentName: str(c.agent_name),
      unattended: boolish(c.unattended),
      turn: turnValue(c.prompt_turn),
      tools: str(c.tools),
      genMs: numOrNullFalsy(c.gen_ms),
      repo: str(c.git_repo),
      branch: str(c.git_branch),
      linesAdded: num(c.lines_added),
      linesRemoved: num(c.lines_removed),
      commits: num(c.agent_commits),
      pushes: num(c.agent_pushes),
      prs: num(c.pr_opened),
      toolErrors: num(c.tool_errors),
      toolsDenied: num(c.tools_denied),
      apiError: boolish(c.api_error),
      permissionMode: str(c.permission_mode),
      // composite '+'-joined string, not milliseconds — kept raw, parsed at use site
      toolMs: str(c.tool_ms),
      tokens,
    })
  }

  out.sort((a, b) => a.time - b.time)
  return out
}
