import { useState } from 'react'
import { bandOf } from '../data/types'
import type { Settings, TechLevel, TrustBand } from '../data/types'
import { Code, Lock, Table, Users, X } from './icons'

type Props = {
  settings: Settings
  /** true once the user has been through this before - lets them back out unchanged */
  canCancel?: boolean
  onDone: (s: Settings) => void
  onCancel?: () => void
}

type Icon = (p: { size?: number; className?: string }) => JSX.Element

/** Question 1 - short label on the tile, one plain sentence once it's picked. */
const KNOW: { id: TechLevel; label: string; means: string; Icon: Icon }[] = [
  { id: 'plain', label: 'Not at all', means: 'I’ll use everyday words.', Icon: Users },
  { id: 'semi', label: 'A little', means: 'I’ll name things and keep it simple.', Icon: Table },
  { id: 'technical', label: 'I code', means: 'I’ll show you the exact commands.', Icon: Code },
]

/**
 * Question 2 - how often it checks in. The band boundaries live in bandOf(); each level
 * sits in the middle of its band. `checks` drives the little picture: of four steps, how
 * many stop and ask.
 */
const ASK: { band: TrustBand; trust: number; label: string; means: string; checks: number }[] = [
  { band: 'low', trust: 20, label: 'Often', means: 'I’ll check with you before almost every step.', checks: 4 },
  { band: 'balanced', trust: 55, label: 'Before changes', means: 'I’ll check before I change your files.', checks: 2 },
  { band: 'high', trust: 85, label: 'Rarely', means: 'I’ll check only when something can’t be undone.', checks: 1 },
]

/** Four steps in a row; the filled ones are where I stop and ask. */
function Checks({ n }: { n: number }) {
  return (
    <span className="tile__checks" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <i key={i} className={i < n ? 'is-ask' : ''} />
      ))}
    </span>
  )
}

export function Onboarding({ settings, canCancel, onDone, onCancel }: Props) {
  const [tech, setTech] = useState<TechLevel>(settings.tech)
  const [trust, setTrust] = useState(settings.trust)
  const band = bandOf(trust)
  const know = KNOW.find((k) => k.id === tech)!
  const ask = ASK.find((a) => a.band === band)!

  return (
    <div className="ob__scrim">
      <div className="ob" role="dialog" aria-modal="true" aria-labelledby="ob-title">
        {canCancel && (
          <button className="ob__close" onClick={onCancel} aria-label="Close">
            <X size={15} />
          </button>
        )}
        <h1 id="ob-title">Two quick questions</h1>

        <fieldset className="ob__q">
          <legend>How well do you know code?</legend>
          <div className="ob__tiles">
            {KNOW.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`tile${tech === o.id ? ' is-on' : ''}`}
                aria-pressed={tech === o.id}
                onClick={() => setTech(o.id)}
              >
                <o.Icon size={20} />
                <span className="tile__label">{o.label}</span>
              </button>
            ))}
          </div>
          <p className="ob__means">{know.means}</p>
        </fieldset>

        <fieldset className="ob__q">
          <legend>When should I check with you?</legend>
          <div className="ob__tiles">
            {ASK.map((l) => (
              <button
                key={l.band}
                type="button"
                className={`tile${band === l.band ? ' is-on' : ''}`}
                aria-pressed={band === l.band}
                onClick={() => setTrust(l.trust)}
              >
                <Checks n={l.checks} />
                <span className="tile__label">{l.label}</span>
              </button>
            ))}
          </div>
          <p className="ob__means">{ask.means}</p>
        </fieldset>

        <button className="btn btn--primary ob__go" onClick={() => onDone({ tech, trust })}>
          Start
        </button>
        <p className="ob__note">
          <Lock size={11} /> Deleting, or anything that can’t be undone, always asks first.
        </p>
      </div>
    </div>
  )
}
