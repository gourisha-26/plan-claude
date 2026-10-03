import { useEffect, useId, useRef, useState } from 'react'
import { say, voice } from '../data/copy'
import type { TechLevel } from '../data/types'
import type { ChatMsg, QueuedDecision, RunStep } from '../lib/useRun'
import { isSacred } from '../lib/useRun'
import { Check, Lock, Shield } from './icons'

type Props = {
  step: RunStep
  index: number
  tech: TechLevel
  /** the run is stopped on this step right now */
  isLive: boolean
  /** steps the user may rewind to, by their displayed number */
  rewindTargets: { key: string; index: number; title: string }[]
  chat: ChatMsg[]
  onPush: (from: ChatMsg['from'], text: string, tone?: ChatMsg['tone']) => void
  onSubmit: (d: QueuedDecision) => void
  onClearQueued: () => void
}

type Awaiting = null | 'phrase' | 'step'
type Intent = { kind: 'approve' | 'rewind' | 'feedback'; step?: number }

/** Read the three things the user is allowed to say, out of whatever they typed. */
export function parseIntent(text: string): Intent {
  const t = text.trim().toLowerCase()
  const stepMatch = t.match(/step\s*(\d+)/)
  if (/\b(rewind|go back|undo|revert)\b/.test(t)) {
    return { kind: 'rewind', step: stepMatch ? Number(stepMatch[1]) : undefined }
  }
  if (/\b(approve|approved|yes|go ahead|do it|proceed|accept)\b/.test(t)) return { kind: 'approve' }
  return { kind: 'feedback' }
}

/**
 * The whole decision surface: a labelled text field on the card. The user writes what they
 * want in their own words; short replies appear above it only once there is a conversation.
 */
export function ChatBox({ step, index, tech, isLive, rewindTargets, chat, onPush, onSubmit, onClearQueued }: Props) {
  const d = step.spec.decision
  const sacred = isSacred(step.spec.triggers)
  const canDecide = !sacred || isLive
  const fieldId = useId()

  const [text, setText] = useState('')
  const [awaiting, setAwaiting] = useState<Awaiting>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const load = (v: string) => {
    setText(v)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  useEffect(() => {
    if (chat.length) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [chat.length])

  if (!d) return null

  const confirm = (what: string) =>
    onPush('ai', isLive ? what : `${what} It runs the moment the flow reaches this step.`, 'good')

  const send = () => {
    const raw = text.trim()
    if (!raw) return
    onPush('you', raw)
    setText('')

    // typing the words is the approval, whether or not "approve" came first
    if (raw.toUpperCase() === d.confirmPhrase.toUpperCase()) {
      setAwaiting(null)
      confirm('Approved.')
      onSubmit({ type: 'approve' })
      return
    }

    if (awaiting === 'phrase') {
      if (raw.toUpperCase() === d.confirmPhrase.toUpperCase()) {
        setAwaiting(null)
        confirm('Approved.')
        onSubmit({ type: 'approve' })
      } else {
        onPush('ai', `That’s not it. Type “${d.confirmPhrase}” exactly.`, 'warn')
      }
      return
    }
    if (awaiting === 'step') {
      const n = Number(raw.match(/\d+/)?.[0])
      const target = rewindTargets.find((t) => t.index === n)
      if (target) {
        setAwaiting(null)
        confirm(`Rewinding to step ${n}.`)
        onSubmit({ type: 'rewind', toKey: target.key, text: 'Rewound from the card.' })
      } else {
        onPush('ai', `I can go back to any step from 1 to ${index}. Which one?`, 'warn')
      }
      return
    }

    const intent = parseIntent(raw)

    if (intent.kind === 'approve') {
      askPhrase()
      return
    }

    if (intent.kind === 'rewind') {
      const target = intent.step != null ? rewindTargets.find((t) => t.index === intent.step) : undefined
      if (target) {
        confirm(`Rewinding to step ${intent.step}.`)
        onSubmit({ type: 'rewind', toKey: target.key, text: raw })
      } else {
        setAwaiting('step')
        onPush('ai', `Which step? Anything from 1 to ${index}.`)
      }
      return
    }

    confirm('Got it - I’ll do that instead.')
    onSubmit({ type: 'feedback', text: raw })
  }

  function askPhrase() {
    // easy to undo: one click is enough - typing is kept for the steps that can't be taken back
    if (d!.oneClick) {
      confirm('Got it.')
      onSubmit({ type: 'approve' })
      return
    }
    setAwaiting('phrase')
    onPush('ai', `Type “${d!.confirmPhrase}” to confirm - I ask for the words so you know exactly what you’re agreeing to.`, 'warn')
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const goBack = d.steer ? voice(d.steer.goBackText, tech) : `Go back to step ${index}`

  /* already settled ahead of time */
  if (step.queued) {
    return (
      <div className="ask ask--queued">
        <p>
          <Check size={13} />
          <span>
            {step.queued.type === 'approve'
              ? 'Approval queued.'
              : step.queued.type === 'feedback'
                ? `Queued: “${step.queued.text}”`
                : 'Rewind queued.'}{' '}
            It runs when the flow gets here.
          </span>
        </p>
        <button onClick={onClearQueued}>Clear</button>
      </div>
    )
  }

  return (
    <div className={`ask${sacred ? ' ask--sacred' : ''}`}>
      {chat.length > 0 && (
        <div className="ask__log">
          {chat.map((m) => (
            <p key={m.id} className={`line line--${m.from}${m.tone ? ` is-${m.tone}` : ''}`}>
              {m.text}
            </p>
          ))}
          <div ref={endRef} />
        </div>
      )}

      {canDecide && (d.failed || d.simpleChoices) ? (
        <div className="ask__choices">
          <button type="button" className="btn btn--primary btn--sm" onClick={() => onSubmit({ type: 'approve' })}>
            {d.approveLabel ?? 'Continue'}
          </button>
          <button type="button" className="btn btn--sm ask__alt" onClick={() => onSubmit({ type: 'feedback', text: voice(d.safer.label, tech) })}>
            {voice(d.safer.label, tech)}
          </button>
        </div>
      ) : canDecide ? (
        <>
          <div className="ask__quick" role="group" aria-label="Steer this step">
            <button
              type="button"
              className="quick-chip quick-chip--phrase"
              onClick={askPhrase}
              title={d.oneClick ? 'Approve' : `Approve - you’ll type “${d.confirmPhrase}” to confirm`}
            >
              <Check size={11} /> {d.approveLabel ?? 'Approve'}
            </button>
            {d.safer && (
              <button
                type="button"
                className="quick-chip quick-chip--safer"
                onClick={() => load(voice(d.safer.label, tech))}
                title="Load a safer instruction into the box - edit it before you send"
              >
                <Shield size={11} /> Change it to…
              </button>
            )}
            {rewindTargets.length > 0 && (
              <button type="button" className="quick-chip" onClick={() => load(goBack)} title="Go back and fix the rule">
                ↺ Go back
              </button>
            )}
          </div>

          <div className="ask__row">
            <input
              ref={inputRef}
              id={fieldId}
              value={text}
              placeholder={
                awaiting === 'phrase'
                  ? `type “${d.confirmPhrase}”`
                  : awaiting === 'step'
                    ? 'e.g. 2'
                    : `approve this · change it to… · go back to step ${d.steer ? index : Math.max(1, index)}`
              }
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button className="ask__send" onClick={send} disabled={!text.trim()}>
              {isLive ? 'Send' : tech === 'plain' ? 'Save choice' : 'Queue'}
            </button>
          </div>
        </>
      ) : (
        <p className="ask__locked">
          <Lock size={12} />
          <span>{say('sacred', tech)}</span>
        </p>
      )}
    </div>
  )
}
