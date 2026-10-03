import { useState } from 'react'
import { voice } from '../data/copy'
import type { useRun } from '../lib/useRun'
import { EvidenceBlock } from './Evidence'
import { Check, Sparkle } from './icons'

type Run = ReturnType<typeof useRun>

/**
 * A basic question about a step, asked in the chat the way Claude Code asks anything:
 * the question, what's involved, one sentence, and a one-click answer. Nothing here is risky -
 * the risky steps are the ones that stop you on the plan.
 */
export function ChatAsk({ run, stepKey }: { run: Run; stepKey: string }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('')
  const idx = run.steps.findIndex((s) => s.key === stepKey)
  const step = run.steps[idx]
  const d = step?.spec.decision
  if (!step || !d) return null

  const tech = run.settings.tech
  const live = step.state === 'blocked' && run.status === 'halted' && run.cursor === idx
  // for something it can't do, the useful sentence is what you do; otherwise, what happens
  const line = d.explain ? voice(d.cantDo ? d.explain.headsUp : d.explain.happens, tech) : voice(d.action, tech)

  const change = () => {
    if (!text.trim()) return
    run.feedbackAt(idx, text.trim())
  }

  return (
    <div className="msg msg--ai msg--ask">
      <Sparkle size={13} className="msg__star" />
      <div className="cask">
        <p className="cask__q">{voice(d.question ?? d.action, tech)}</p>
        <EvidenceBlock ev={d.evidence} />
        <p className="cask__line">{line}</p>

        {live &&
          (editing ? (
            <form
              className="cask__edit"
              onSubmit={(e) => {
                e.preventDefault()
                change()
              }}
            >
              <input value={text} onChange={(e) => setText(e.target.value)} autoFocus />
              <button type="submit" className="btn btn--primary btn--sm" disabled={!text.trim()}>
                Send
              </button>
            </form>
          ) : (
            <div className="cask__btns">
              <button type="button" className="btn btn--primary btn--sm" onClick={() => run.approveAt(idx)}>
                <Check size={13} /> {d.approveLabel ?? 'Yes'}
              </button>
              <button
                type="button"
                className="btn btn--sm cask__alt"
                onClick={() => {
                  setText(voice(d.safer.label, tech))
                  setEditing(true)
                }}
              >
                Change something
              </button>
            </div>
          ))}
      </div>
    </div>
  )
}
