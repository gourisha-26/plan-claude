import { useState } from 'react'
import { voice } from '../data/copy'
import type { Decision, TechLevel, TriggerId, Voiced } from '../data/types'
import { isSacred } from '../lib/plan'
import { EvidenceBlock } from './Evidence'
import { Alert, Chevron, Eye, Lock, ShieldOff, Table } from './icons'

interface Props {
  decision: Decision
  triggers: TriggerId[]
  tech: TechLevel
  onDataFiles: () => void
  onAdoptSafer?: () => void
}

/** Older scenarios were written before the four-line explanation - derive it from what they have. */
function explainOf(d: Decision): { happens: Voiced; risky: Voiced; assumed: Voiced; headsUp: Voiced } {
  if (d.explain) return d.explain
  return {
    happens: d.action,
    risky: d.cost.reversible
      ? V3('I can undo this if it’s wrong.', 'Reversible.', 'Reversible.')
      : V3('Once it’s done, I can’t bring it back.', 'Permanent - can’t be undone.', 'Irreversible.'),
    assumed: d.rule ?? d.understood,
    headsUp: d.cost.casualty,
  }
}
const V3 = (plain: string, semi: string, technical: string) => ({ plain, semi, technical })

/**
 * An open step, kept short: the question, what's involved, one sentence on what happens,
 * and one heads-up when something needs attention. The rest waits behind "More detail".
 */
export function ImpactSnapshot({ decision: d, triggers, tech, onDataFiles, onAdoptSafer }: Props) {
  const [more, setMore] = useState(false)
  // "Review affected screens" - the full list waits behind a click, so the question comes first
  const [review, setReview] = useState(false)
  const sacred = isSacred(triggers)
  const x = explainOf(d)
  const easy = d.cost.reversible
  // the picture of what's involved goes up front; denser evidence from older scenarios waits
  const inline = ['images', 'site', 'pages', 'screens', 'variants'].includes(d.evidence.kind) || (d.evidence.kind === 'proof' && easy)
  // the image grid asks its own question about the flagged files - don't say it twice
  const showHeadsUp = d.evidence.kind !== 'images'

  return (
    <div className="impact-snapshot">
      {d.question && (
        <p className={`impact-q${easy && !d.failed ? ' is-check' : ''}`}>
          {sacred ? <Lock size={13} /> : d.cantDo ? <ShieldOff size={13} /> : easy && !d.failed ? <Eye size={13} /> : <Alert size={13} />}
          <span>{voice(d.question, tech)}</span>
        </p>
      )}

      {inline && !d.review && <EvidenceBlock ev={d.evidence} onKeep={d.evidence.kind === 'images' ? onAdoptSafer : undefined} />}

      <p className="impact-say">{voice(x.happens, tech)}</p>
      {showHeadsUp && (
        <p className={`impact-heads${easy ? ' is-easy' : ''}`}>
          {!easy && <Alert size={12} />}
          <span>{voice(x.headsUp, tech)}</span>
        </p>
      )}

      {d.review && (
        <>
          <button type="button" className="impact-review" onClick={() => setReview((v) => !v)} aria-expanded={review}>
            <Chevron size={11} className={`impact-tab__chev${review ? ' is-open' : ''}`} /> {d.reviewLabel ?? 'Review affected screens'}
          </button>
          {review && <EvidenceBlock ev={d.evidence} />}
        </>
      )}

      <div className="impact-tabs">
        {d.dataFiles.length > 0 && (
          <button type="button" className="impact-tab impact-tab--copy" onClick={onDataFiles}>
            <Table size={12} />
            <span>Try it on a copy first</span>
          </button>
        )}
        <button type="button" className="impact-more" onClick={() => setMore((v) => !v)} aria-expanded={more}>
          <Chevron size={10} className={`impact-tab__chev${more ? ' is-open' : ''}`} /> More detail
        </button>
      </div>

      {more && (
        <dl className="explain">
          <div className={`explain__row is-risky${easy ? ' is-easy' : ''}`}>
            <dt>{d.cantDo ? 'Why I won’t' : d.failed ? 'Why it broke' : easy ? 'Is it risky?' : 'Why it’s risky'}</dt>
            <dd>{voice(x.risky, tech)}</dd>
          </div>
          <div className="explain__row is-assumed">
            <dt>{d.failed ? 'What I know' : 'What I assumed'}</dt>
            <dd>{voice(x.assumed, tech)}</dd>
          </div>
          {!inline && (
            <div className="explain__row">
              <dt>Affected</dt>
              <dd>
                <EvidenceBlock ev={d.evidence} />
              </dd>
            </div>
          )}
          {tech === 'technical' && d.technicalNote && (
            <div className="explain__row">
              <dt>Command</dt>
              <dd>
                <code className="impact-cmd">{d.technicalNote}</code>
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  )
}
