import { V } from '../data/copy'
import { SACRED_TRIGGERS, bandOf } from '../data/types'
import type { Scenario, Settings, StepSpec, TriggerId } from '../data/types'

export const isSacred = (triggers: TriggerId[]) => triggers.some((t) => SACRED_TRIGGERS.includes(t))

/**
 * A basic, easy-to-undo question ("does the preview look right?") is asked in the chat, the way
 * Claude Code asks anything. The plan diagram is kept for what it will do and for the risky steps.
 */
export const asksInChat = (step: StepSpec) => !!step.decision?.oneClick && !step.decision.failed

/**
 * Does this step stop the user, given how much they trust the AI?
 *
 * Sacred steps ignore the setting entirely - that is the whole point of the class.
 * At high trust only the genuinely irreversible ones interrupt; everything else flows.
 */
export function stopsUser(step: StepSpec, st: Settings): boolean {
  if (isSacred(step.triggers)) return true
  // when something broke, it always stops and says so - no setting turns that off
  if (step.decision?.failed) return true
  if (step.tier === 'safe') return false
  if (bandOf(st.trust) === 'high') return step.triggers.includes(1)
  return true
}

/**
 * Trust reshapes the plan itself, not just how often it asks.
 *
 *   low       - every step that reads real records starts asking too, and a checkpoint
 *               is inserted after anything that stopped you. The graph gets long.
 *   balanced  - the plan as authored.
 *   high      - consecutive safe steps collapse into one, so the graph is short and
 *               only the irreversible work is left standing on its own.
 */
export function buildPlan(scenario: Scenario, st: Settings): StepSpec[] {
  const band = bandOf(st.trust)
  if (band === 'balanced') return scenario.steps

  if (band === 'low') {
    const out: StepSpec[] = []
    scenario.steps.forEach((s) => {
      // reading real data is no longer automatic at this trust level
      const promoted: StepSpec =
        s.tier === 'safe' && s.sensitive
          ? {
              ...s,
              tier: 'stop',
              triggers: [2],
              preview: V(
                'You asked me to check in more often. This step only looks - but it looks at your real files, so at your setting it asks first.',
                'You asked me to check in more often. This step only reads - but it reads your real files, so at your setting it asks first.',
                'Read-only, but the read targets live data. Promoted to a stopping step under the current check-in setting.',
              ),
            }
          : s
      out.push(promoted)
      if (promoted.tier !== 'safe') {
        out.push({
          id: `${s.id}-check`,
          title: 'Show you exactly what that changed',
          plain: V(
            `Shows you everything “${s.title}” changed, before anything else happens.`,
            `Lists what “${s.title}” touched, before anything else runs.`,
            `Renders the write set produced by “${s.title}” before the next step executes.`,
          ),
          tier: 'safe',
          triggers: [],
          tool: 'Render checkpoint',
        })
      }
    })
    return out
  }

  // high trust - collapse runs of consecutive safe steps
  const out: StepSpec[] = []
  let run: StepSpec[] = []
  const flush = () => {
    if (run.length === 0) return
    if (run.length === 1) out.push(run[0])
    else {
      out.push({
        id: `${run[0].id}-bundle`,
        title: `Prepare - ${run.length} safe steps`,
        plain: V(
          run.map((r) => r.title).join(' · ') + '. Every one can be undone, and none of them delete anything.',
          run.map((r) => r.title).join(' · ') + '. All reversible, none of them delete anything.',
          run.map((r) => r.title).join(' · ') + '. All reversible; no destructive writes.',
        ),
        tier: 'safe',
        triggers: [],
        tool: run.map((r) => r.tool).filter(Boolean).join('  ·  '),
      })
    }
    run = []
  }
  for (const s of scenario.steps) {
    if (s.tier === 'safe') run.push(s)
    else {
      flush()
      out.push(s)
    }
  }
  flush()
  return out
}

/** Used by the onboarding preview to show what a trust level actually buys. */
export function planStats(scenario: Scenario, st: Settings) {
  const steps = buildPlan(scenario, st)
  return {
    total: steps.length,
    stopping: steps.filter((s) => stopsUser(s, st)).length,
  }
}
