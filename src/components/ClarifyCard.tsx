import { useState } from 'react'
import type { Clarify, ClarifyOption, PreviewKind } from '../data/caseStudy'
import { Alert, Check, Question, ShieldOff } from './icons'

type Props = {
  clarify: Clarify
  /** the option the person already chose, once they have */
  answered?: string
  onPick: (o: ClarifyOption) => void
  onAnswer: (text: string) => void
}

const KIND_LABEL = {
  vague: 'Not sure what you meant',
  missing: 'Missing one detail',
  clash: 'Two instructions clash',
  cant: 'Outside my limits',
} as const

/**
 * Ask, don't guess. Instead of planning on a silent assumption, the agent asks one clear
 * question - or offers 2–3 options with previews - before it plans anything.
 */
export function ClarifyCard({ clarify: c, answered, onPick, onAnswer }: Props) {
  const [text, setText] = useState('')
  const Icon = c.kind === 'cant' ? ShieldOff : c.kind === 'clash' ? Alert : Question
  const done = answered != null

  return (
    <div className={`clar is-${c.kind}${done ? ' is-done' : ''}`}>
      <span className="clar__kind">
        <Icon size={11} /> {KIND_LABEL[c.kind]}
      </span>
      <h3 className="clar__title">{c.title}</h3>
      <p className="clar__body">{c.body}</p>

      {c.how && (
        <ol className="clar__how">
          {c.how.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ol>
      )}

      {c.options && (
        <div className={`clar__opts${c.options.some((o) => o.preview) ? ' has-previews' : ''}`}>
          {c.options.map((o) => (
            <button
              key={o.label}
              type="button"
              className={`clar__opt${answered === o.label ? ' is-on' : ''}`}
              disabled={done}
              onClick={() => onPick(o)}
            >
              {o.preview && <Preview kind={o.preview} />}
              <span className="clar__optlabel">{o.label}</span>
              <span className="clar__optdetail">{o.detail}</span>
              {answered === o.label && (
                <span className="clar__chosen">
                  <Check size={11} /> chosen
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {c.question &&
        (done ? (
          <p className="clar__answer">
            <Check size={12} /> {c.question.label}: <b>{answered}</b>
          </p>
        ) : (
          <form
            className="clar__ask"
            onSubmit={(e) => {
              e.preventDefault()
              if (text.trim()) onAnswer(text.trim())
            }}
          >
            <label>
              <span>{c.question.label}</span>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder={c.question.placeholder} />
            </label>
            <button type="submit" className="btn btn--primary btn--sm" disabled={!text.trim()}>
              Continue
            </button>
          </form>
        ))}

      {!done && c.kind !== 'cant' && <p className="clar__foot">I’ll wait. Nothing is planned until you answer.</p>}
    </div>
  )
}

/** A thumbnail of what each reading of the request would look like. */
function Preview({ kind }: { kind: PreviewKind }) {
  return (
    <span className={`pv pv--${kind}`} aria-hidden>
      <i className="pv__nav" />
      <i className="pv__h" />
      <i className="pv__p" />
      <i className="pv__btn" />
    </span>
  )
}
