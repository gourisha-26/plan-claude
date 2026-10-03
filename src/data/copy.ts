import type { TechLevel, TriggerId, Voiced } from './types'

/**
 * Intelligent beginner translation: simplifies developer jargon into warm, dead-simple English.
 */
export function simplifyForBeginner(text: string): string {
  if (!text) return ''
  let s = text.trim()

  // High-frequency safety warnings & AI outputs
  if (/irreversible deletion|loss of critical audit|corruption of the entire database/i.test(s)) {
    return 'Warning: This will permanently delete your real records, and you will not be able to get them back.'
  }
  if (/database operations require backend context/i.test(s)) {
    return 'Stop: This will delete real database records.'
  }
  if (/provide backend project context/i.test(s)) {
    return 'Only delete test accounts one by one without touching the real database.'
  }
  if (/destructive mutation|terminate.*wiped/i.test(s)) {
    return 'Permanent deletion of live data.'
  }
  if (/exceeds request scope/i.test(s)) {
    return 'This changes much more than what you asked for.'
  }
  if (/turn.*off.*confirm_before_delete|delete guard/i.test(s)) {
    return 'This turns off your safety protection questions.'
  }

  // General phrase translations
  s = s
    .replace(/\b(irrespective of|in accordance with|pursuant to)\b/gi, 'under')
    .replace(/\b(irreversible deletion of|irreversible deletion)\b/gi, 'permanently deleting')
    .replace(/\b(corruption of)\b/gi, 'damaging')
    .replace(/\b(production database|production schema|live database)\b/gi, 'real database')
    .replace(/\b(production|prod)\b/gi, 'real')
    .replace(/\b(schema synchronization|schema migration|database migration)\b/gi, 'database update')
    .replace(/\b(foreign key constraints|foreign keys)\b/gi, 'connected records')
    .replace(/\b(PII\/PHI|PII|PHI)\b/gi, 'personal records')
    .replace(/\b(immutable audit logs|audit logs|audit trail|audit log|audit stream)\b/gi, 'history records')
    .replace(/\b(blast radius)\b/gi, 'accidental damage')
    .replace(/\b(idempotent)\b/gi, 'safe to repeat')
    .replace(/\b(destructive operations|destructive operation|destructive mutations|destructive mutation)\b/gi, 'permanent deletion')
    .replace(/\b(mitigation|mitigations)\b/gi, 'safer way')
    .replace(/\b(authentication middleware)\b/gi, 'login check')
    .replace(/\b(credentials)\b/gi, 'passwords and keys')
    .replace(/\b(unthrottled)\b/gi, 'all at once')
    .replace(/\b(terminate and dismantle|terminate and delete)\b/gi, 'shut down and delete')
    .replace(/\b(filesystem)\b/gi, 'computer files')
    .replace(/\b(rebuilds the entire table)\b/gi, 'erases and replaces the whole table')
    .replace(/\b(consultation notes)\b/gi, 'saved doctor notes')
    .replace(/\b(SELECT over \d+ rows|SELECT across|read-only, no writes)\b/gi, 'Just looks at records without changing anything')
    .replace(/\b(execute unverified|executed unverified)\b/gi, 'run without checking')
    .replace(/\b(mutates a guard|mutates a control)\b/gi, 'turns off a safety lock')
    .replace(/\b(hard-deletes|hard-delete|hard-deleted)\b/gi, 'permanently deletes')
    .replace(/\b(soft-delete|soft delete)\b/gi, 'trash bin')
    .replace(/\b(non-delegable confirmation barrier|non-delegable)\b/gi, 'must be confirmed by you')
    .replace(/\b(high-impact gated step)\b/gi, 'important step that stops to protect your data')
    .replace(/\b(unrecoverable)\b/gi, 'cannot be brought back')
    .replace(/\b(privilege level|privileges)\b/gi, 'permissions')
    .replace(/\b(superadmin|root access)\b/gi, 'full administrator')
    .replace(/\b(telemetry)\b/gi, 'activity history')
    .replace(/\b(downstream consumers)\b/gi, 'other connected apps')
    .replace(/\b(dry-run discovery only)\b/gi, 'just checking, no changes made')

  // Clean out shell commands in parentheses e.g. "(cat package.json)" or "(find . -name ...)"
  s = s.replace(/\s*\([a-z0-9_.\-\s*"'$/]+\)/gi, '')

  return s
}

/**
 * Simplifies step titles for beginners so they don't see shell scripts or opaque status codes.
 */
export function simplifyStepTitleForBeginner(title: string, stops = false): string {
  if (!title) return ''
  const lower = title.toLowerCase()

  if (lower.includes('stop') || stops) {
    if (lower.includes('database') || lower.includes('table') || lower.includes('user') || lower.includes('patient') || lower.includes('schema') || lower.includes('merge') || lower.includes('drop')) {
      return 'Stop: Permanently changes real user records'
    }
    if (lower.includes('cloud') || lower.includes('s3') || lower.includes('bucket') || lower.includes('server') || lower.includes('infra')) {
      return 'Stop: Deletes cloud files & servers'
    }
    if (lower.includes('log') || lower.includes('file') || lower.includes('disk') || lower.includes('purge')) {
      return 'Stop: Permanently erases files'
    }
    if (lower.includes('auth') || lower.includes('admin') || lower.includes('permission') || lower.includes('security') || lower.includes('delete guard')) {
      return 'Stop: Changes your safety settings'
    }
    return 'Stop: Needs your permission before deleting anything'
  }

  // Safe read/inspection steps
  const cleaned = title.replace(/\s*\([a-z0-9_.\-\s*"'$/]+\)/gi, '').trim()
  if (/search for database|find database|check database/i.test(cleaned)) return 'Check database settings (safe)'
  if (/inspect frontend|review user list|inspect dependencies|analyze scope/i.test(cleaned)) return 'Look at project setup files (safe)'
  if (/^read /i.test(cleaned)) return `${cleaned} (no changes)`
  if (/^stage target|calculate blast/i.test(cleaned)) return 'Test what would change (safe)'
  if (/^verify|health check/i.test(cleaned)) return 'Double check everything works (safe)'

  return cleaned
}

/** Resolve a line to the register the user chose. Bare strings are level-agnostic. */
export const voice = (v: Voiced, tech: TechLevel): string => {
  if (!v) return ''
  if (typeof v === 'string') {
    return tech === 'plain' ? simplifyForBeginner(v) : v
  }
  const chosen = v[tech] || (tech === 'plain' ? v.plain || v.semi : tech === 'semi' ? v.semi || v.technical : v.technical) || ''
  return tech === 'plain' ? simplifyForBeginner(chosen) : chosen
}

/** Author a three-register line. Order is beginner, intermediate, engineer. */
export const V = (plain: string, semi: string, technical: string): Record<TechLevel, string> => ({ plain, semi, technical })

/**
 * One idea, written three ways. The user picks a register before their first prompt and
 * every explanation in the product is framed in it - the risk never changes, only the words.
 */
type Reg = Record<TechLevel, string>
const R = (plain: string, semi: string, technical: string): Reg => ({ plain, semi, technical })

export const COPY = {
  whatItDoes: R('What happens if this runs', 'What this step does', 'Operation'),
  permissions: R('Why this one is risky', 'Permissions it needs', 'Risk triggers'),
  understood: R('What I think you asked for', 'What I understood you want', 'Interpretation'),
  action: R('What I am about to do', 'The action I’m taking', 'Action'),
  realData: R('Who this happens to', 'What that does to your real data', 'Affected rows'),
  cost: R('What it costs you', 'What it costs', 'Blast radius'),
  safer: R('The gentler way to do it', 'A safer option', 'Reduced-scope alternative'),
  dataFiles: R('Show me what it touches', 'Show data files', 'Show target files'),
  noRisk: R(
    'Nothing here can hurt you. It only looks at things.',
    'No risky permission. Reversible, and it touches nothing sensitive.',
    'No triggers. Read-only, idempotent, no writes to sensitive tables.',
  ),
  sacred: R(
    'I’ll ask you about this when I get here. Big changes like this can’t be approved ahead of time.',
    'I’ll ask you about this when I get here. Changes this big can’t be approved ahead of time.',
    'Always stops when reached - can’t be pre-approved, at any check-in setting.',
  ),
  dummyExplain: R(
    'I will make a copy of your files first and do it there, so you can see what happens without anything real changing.',
    'I run the change against a throwaway copy first, so you can read the result before it touches anything real.',
    'Applies the change to a scratch clone and returns the diff plus post-state metrics. No writes to the live target.',
  ),
} as const

export const say = (key: keyof typeof COPY, tech: TechLevel) => COPY[key][tech]

/** The four triggers, explained at the right altitude. */
export const TRIGGER_COPY: Record<TriggerId, Reg> = {
  1: R(
    'Once it happens, I cannot put it back',
    'Irreversible - permanent delete, dropping a column with data, merging records',
    'Irreversible: no soft-delete, no transaction rollback available post-commit',
  ),
  2: R(
    'It touches your real work, not a copy',
    'Touches real data - your own files or records, not a scratch copy',
    'Writes to live, non-reproducible data',
  ),
  3: R(
    'It does much more than you asked for',
    'Bigger than the ask - the action is larger than the request',
    'Blast radius exceeds request scope',
  ),
  4: R(
    'It switches off one of your own safety checks',
    'Changes a safety setting itself',
    'Mutates a guard/confirmation setting',
  ),
}

export const triggerText = (t: TriggerId, tech: TechLevel) => TRIGGER_COPY[t][tech]

/** The risk chip on a card. */
export function riskChip(triggers: TriggerId[], tech: TechLevel, sacred: boolean): string {
  if (sacred) return tech === 'plain' ? 'always stops you' : 'sacred · always stops'
  if (triggers.length === 0) return 'check it first'
  if (triggers.includes(1)) return tech === 'technical' ? 'irreversible' : 'can’t undo'
  if (tech === 'plain') return 'needs your say-so'
  if (tech === 'technical') return `triggers ${triggers.join(', ')}`
  return `${triggers.length} risky permission${triggers.length === 1 ? '' : 's'}`
}
