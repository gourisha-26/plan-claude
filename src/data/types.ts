/**
 * The layer's data model.
 *
 * Two questions, kept deliberately separate everywhere in this codebase:
 *   permission     - "can I?"          → Step.triggers / Step.tier
 *   interpretation - "did I get you?"  → Decision.understood / Decision.evidence
 */

/** The four triggers of the risk rule. Kept as data so the UI can cite them. */
export const TRIGGERS = {
  1: { id: 1, label: 'Irreversible', hint: 'permanent delete, dropping a column with data, merging records' },
  2: { id: 2, label: 'Touches real, sensitive data', hint: 'your own files or records - not a scratch copy' },
  3: { id: 3, label: 'Bigger than the ask', hint: 'blast radius larger than what was requested' },
  4: { id: 4, label: 'Changes a safety setting', hint: 'turning off a confirm-before-delete step' },
} as const

export type TriggerId = 1 | 2 | 3 | 4

/** Triggers 3 and 4 are sacred: never auto-approvable, never pre-decidable. */
export const SACRED_TRIGGERS: TriggerId[] = [3, 4]

export type Tier = 'safe' | 'stop' | 'sacred'

/* ------------------------------------------------------------------ *
 * who is reading this, and how much do they trust the AI
 * ------------------------------------------------------------------ */

/** Chosen before the first prompt. Decides the register every explanation is written in. */
export type TechLevel = 'plain' | 'semi' | 'technical'

/**
 * A line that can be said three ways. The meaning never changes between them - only the
 * register does. A bare string is the same sentence at every level.
 */
export type Voiced = string | Record<TechLevel, string>

export const TECH_LEVELS: { id: TechLevel; label: string; blurb: string }[] = [
  {
    id: 'plain',
    label: 'Not technical',
    blurb: 'I run the practice. I do not read code. Tell me what happens to my patients’ records.',
  },
  {
    id: 'semi',
    label: 'Somewhat technical',
    blurb: 'I built this tool with AI help. I know what a table and a column are, roughly.',
  },
  {
    id: 'technical',
    label: 'Engineer',
    blurb: 'Show me the operation, the columns, and the query. I will judge the blast radius myself.',
  },
]

/**
 * 0–100. High trust = only the genuinely dangerous steps stop you, and the safe
 * work is collapsed. Low trust = the plan is expanded into smaller steps and far
 * more of them ask. Sacred steps ignore this entirely.
 */
export type Trust = number

export type Settings = { tech: TechLevel; trust: Trust }

export const DEFAULT_SETTINGS: Settings = { tech: 'semi', trust: 55 }

export type TrustBand = 'low' | 'balanced' | 'high'
export const bandOf = (t: Trust): TrustBand => (t <= 35 ? 'low' : t >= 75 ? 'high' : 'balanced')

/* ------------------------------------------------------------------ *
 * evidence - always concrete instances, never SQL
 * ------------------------------------------------------------------ */

export type FieldValue = {
  label: string
  value: string
  /** true when this field is where the two records genuinely disagree */
  conflict?: boolean
}

export type PersonRecord = {
  name: string
  meta: string
  fields: FieldValue[]
}

export type Evidence =
  | {
      kind: 'pairs'
      caption: string
      pairs: { left: PersonRecord; right: PersonRecord; verdict: string; same: boolean }[]
    }
  | {
      kind: 'group'
      caption: string
      sharedLabel: string
      sharedValue: string
      members: { name: string; role: string; detail: string }[]
      verdict: string
    }
  | {
      kind: 'schema'
      caption: string
      table: string
      rows: string
      columns: { name: string; sample: string; fate: 'kept' | 'added' | 'destroyed' }[]
    }
  | {
      kind: 'setting'
      caption: string
      setting: string
      before: string
      after: string
      history: string
    }
  | {
      kind: 'proof'
      caption: string
      rows: { label: string; value: string; status: 'ok' | 'bad' | 'unknown' }[]
    }
  | {
      /** two ways to do it, side by side, as they'd look on a phone */
      kind: 'variants'
      caption: string
      variants: { label: string; detail: string; style: 'burger' | 'small' }[]
    }
  | {
      /** every screen a shared piece shows up on - the one you asked about is marked */
      kind: 'screens'
      caption: string
      screens: { name: string; asked?: boolean }[]
    }
  | {
      /** every page, as it looks on a phone - the ones that broke are marked */
      kind: 'pages'
      caption: string
      pages: { name: string; ok: boolean }[]
    }
  | {
      /** the site itself: a browser frame, and every page marked by what happens to it */
      kind: 'site'
      caption: string
      url: string
      pages: { name: string; change: 'new' | 'updated' | 'removed' | 'same'; asked?: boolean; unfinished?: boolean }[]
      verdict: string
    }
  | {
      /** the real files, shown as files - so the person judges them, not the command */
      kind: 'images'
      caption: string
      items: { name: string; note: string; flagged?: boolean; hue: number }[]
      /** what is not shown in the grid */
      more?: string
      /** the right question, asked about the flagged files */
      verdict: string
    }

/* ------------------------------------------------------------------ *
 * the data files a step would touch, and the dummy-run preview
 * ------------------------------------------------------------------ */

export type DiffLine = { type: 'ctx' | 'add' | 'del'; text: string }

export type DataFile = {
  path: string
  kind: 'database' | 'code' | 'config' | 'files'
  /** what this step does to this particular file, in one line */
  note: string
  /** how much of it is affected */
  scope: string
  /** shown after the dummy copy is generated */
  diff: DiffLine[]
  /** what the change actually did to the dummy copy */
  impact: string
  /** true when the impact is a loss rather than a change */
  destructive: boolean
}

export type Decision = {
  /** Block 1 - the interpretation, in plain language. */
  understood: Voiced
  /** the action the AI is about to take, stated as an action */
  action: Voiced
  /** the rule the AI silently invented, quoted back */
  rule?: Voiced
  /** Block 2 - concrete records. */
  evidence: Evidence
  /** Block 3 - the cost. */
  cost: {
    reversible: boolean
    casualty: Voiced
    detail: Voiced
  }
  /** Block 4 - the smaller-blast-radius path. */
  safer: {
    label: Voiced
    detail: Voiced
    resultTitle: string
    resultNote: string
  }
  approveResultNote: string
  /**
   * Approval is typed, not clicked. The phrase names the actual consequence, so the
   * user has to put it through their own fingers before it happens.
   */
  confirmPhrase: string
  /** the files this step would write to, previewable on a dummy copy first */
  dataFiles: DataFile[]
  /** shown only to engineers - the real operation behind the plain words */
  technicalNote?: string
  /**
   * The right question - about the person's stuff, not about the command.
   * "Are these images really unused?", never "Do you allow this delete command?"
   */
  question?: Voiced
  /** the same step said four ways: what happens, why it's risky, what I assumed, heads up */
  explain?: { happens: Voiced; risky: Voiced; assumed: Voiced; headsUp: Voiced }
  /** the summary of the run on a copy, one line per thing that changed */
  testRun?: { label: string; value: string; flag?: boolean }[]
  /** steering: what "change it to…" and "go back" load into the box */
  steer?: {
    goBackTo: string
    goBackText: Voiced
    /** the plan that replaces everything from goBackTo onwards */
    afterGoBack: StepSpec[]
  }
  /** easy to undo, so approving is one click - typing to confirm is kept for risky steps */
  oneClick?: boolean
  /** the words on the approve button, when "Approve" isn't the plainest thing to say */
  approveLabel?: string
  /** outside its limits: it can't do this step and won't work around it - you do it, then say so */
  cantDo?: boolean
  /** something it did broke something else - it always stops and says so, whatever the settings */
  failed?: boolean
  /** two plain buttons - approve and the safer option - with no typing; used when it's easy to undo */
  simpleChoices?: boolean
  /** the affected screens wait behind "Review affected screens" rather than showing straight away */
  review?: boolean
  /** the words on that review link, when "Review affected screens" isn't the right thing to say */
  reviewLabel?: string
  /** the words on the step's tag, when the trigger's own label isn't the plainest thing to say */
  chip?: Voiced
  /** approving this is what the person meant - finishing on it is not a loss */
  intended?: boolean
  /** closing lines when the run ends on this decision */
  outcome?: { approve?: string; safer?: string }
}

export type StepSpec = {
  id: string
  title: string
  /** the title as a beginner reads it; when absent it is simplified automatically */
  plainTitle?: string
  /** a silent guess made visible - "I assumed this", shown on the card without a click */
  assumed?: Voiced
  /** a rule the person gave - shown the same way, so they can see it was applied */
  yourRule?: Voiced
  /** something worth knowing about this step, shown on the card - "shared by 6 pages" */
  note?: Voiced
  /** plain-English description of what it changes overall */
  plain: Voiced
  tier: Tier
  triggers: TriggerId[]
  /** shown in the "what this means" disclosure */
  preview?: Voiced
  decision?: Decision
  /** steps appended to the plan after this one resolves, tagged NEW */
  followUps?: { approve?: StepSpec[]; safer?: StepSpec[] }
  /** terminal line shown in the Claude Code transcript while running */
  tool?: string
  /**
   * A safe step that still reads real data. At low trust these are promoted
   * to steps that stop you, which is what makes a low-trust plan longer.
   */
  sensitive?: boolean
}

export type Scenario = {
  id: string
  prompt: string
  chip: string
  failure: string
  proves: string
  reply: Voiced
  steps: StepSpec[]
  outcome: { approve: string; safer: string }
}
