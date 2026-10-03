import { useEffect, useState, type ReactNode } from 'react'
import { riskChip, say, simplifyStepTitleForBeginner, triggerText, voice } from '../data/copy'
import type { TechLevel } from '../data/types'
import type { RunStep } from '../lib/useRun'
import { STEP_MS, isSacred } from '../lib/useRun'
import { ImpactSnapshot } from './ImpactSnapshot'
import { Alert, Check, Chevron, Eye, Lock, Pause, Play, Question, Shield, ShieldOff, X } from './icons'

type Props = {
  step: RunStep
  index: number
  tech: TechLevel
  progress: number
  stops: boolean
  /** this card is the one the user has opened */
  selected: boolean
  onSelect: () => void
  onDataFiles: () => void
  onPause: () => void
  onSkip: () => void
  onAdoptSafer?: () => void
  /** a basic question about this step is asked in the chat, not here */
  askedInChat?: boolean
  /** the decision field, rendered inside the card */
  children?: ReactNode
}

const mmss = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

type Panel = 'desc' | 'perm'

export function FlowCard({ step, index, tech, progress, stops, selected, onSelect, onDataFiles, onPause, onSkip, onAdoptSafer, askedInChat, children }: Props) {
  const [open, setOpen] = useState<Panel[]>([])
  const toggle = (p: Panel) => setOpen((o) => (o.includes(p) ? o.filter((x) => x !== p) : [...o, p]))
  const has = (p: Panel) => open.includes(p)

  const d = step.spec.decision

  /* Stopping cards display the visual ImpactSnapshot on selection or block; safe cards expand description */
  useEffect(() => {
    if (selected && (!d || !stops)) setOpen(['desc'])
    else if (!selected) setOpen([])
  }, [selected, d, stops])

  /* ignore clicks that landed on something interactive - buttons own their own behaviour */
  const onCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea, a, .ask, .chat')) return
    onSelect()
  }
  const sacred = isSacred(step.spec.triggers)
  const running = step.state === 'running'
  // stops, but nothing about it is risky - it only wants you to look first
  // something broke - always red, whatever the triggers say
  const failed = stops && !!d?.failed
  const check = stops && step.spec.triggers.length === 0 && !failed
  // outside its limits: it waits for you to do this part
  const cant = stops && !!d?.cantDo

  const cls = [
    'card',
    stops ? (sacred ? 'card--sacred' : cant ? 'card--cant' : check ? 'card--check' : 'card--stop') : 'card--safe',
    `is-${step.state}`,
    step.discarded ? 'is-discarded' : '',
    askedInChat ? 'is-asking' : '',
    step.queued ? 'has-queued' : '',
    step.outcome === 'approved' && !d?.intended ? 'is-approved' : '',
    step.outcome === 'counter' ? 'is-counter' : '',
    selected ? 'is-open' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const displayedTitle =
    step.resultTitle ??
    (tech === 'plain' ? step.spec.plainTitle ?? simplifyStepTitleForBeginner(step.spec.title, stops) : step.spec.title)

  return (
    <article
      className={cls}
      onClick={onCardClick}
      role="button"
      tabIndex={0}
      aria-expanded={selected}
      onKeyDown={(e) => {
        // only the card itself - keys typed into the decision box bubble up here too
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect() }
      }}
    >
      <span className="card__port card__port--in" aria-hidden />
      <span className="card__port card__port--out" aria-hidden />

      <header className="card__head">
        <span className="card__num">{index + 1}</span>
        <h3 className="card__title">{displayedTitle}</h3>
        {step.isNew && !step.discarded && <span className="card__new">NEW</span>}
        {stops && !step.discarded && step.outcome !== 'counter' && (
          <span className={`card__risk${sacred ? ' is-sacred' : ''}`}>
            {sacred ? <Lock size={11} /> : cant ? <ShieldOff size={11} /> : check ? <Eye size={11} /> : <Alert size={11} />}
            {d?.chip ? voice(d.chip, tech) : failed ? 'something broke' : cant ? 'I can’t do this' : riskChip(step.spec.triggers, tech, sacred)}
          </span>
        )}
        {askedInChat && step.state === 'blocked' ? (
          <span className="pill pill--chat">answer in chat</span>
        ) : (
          <Status step={step} />
        )}
      </header>

      {/* a silent guess, made visible without a click - and a rule you gave, shown being applied */}
      {step.spec.assumed && !step.discarded && (
        <p className="card__assumed">
          <Question size={12} />
          <span>
            {tech === 'technical' ? 'Inferred: ' : 'I assumed: '}
            <b>{voice(step.spec.assumed, tech)}</b>
          </span>
        </p>
      )}
      {step.spec.note && !step.discarded && (
        <p className="card__assumed is-note">
          <Alert size={12} />
          <span>{voice(step.spec.note, tech)}</span>
        </p>
      )}
      {step.spec.yourRule && (
        <p className="card__assumed is-yours">
          <Shield size={12} />
          <span>
            Your rule: <b>{voice(step.spec.yourRule, tech)}</b>
          </span>
        </p>
      )}

      {running && (
        <div className="card__prog">
          <span className="card__track">
            <span className="card__fill" style={{ transform: `scaleX(${progress})` }} />
          </span>
          <span className="card__time">{mmss(STEP_MS * (1 - progress))} left</span>
          <button className="card__skip" onClick={onSkip}>{tech === 'plain' ? 'skip' : 'skip wait'}</button>
        </div>
      )}

      {step.counterNote && (
        <p className="card__yours">
          <Shield size={12} />
          <span>You said: “{step.counterNote}”</span>
        </p>
      )}

      {/* the + disclosures - brief by default, expandable on click */}
      {!(stops && d && selected) && (
      <div className="card__plus">
        <button className={has('desc') ? 'is-on' : ''} onClick={() => toggle('desc')}>
          <Chevron size={11} className="plus__chev" /> {tech === 'plain' ? 'what it does' : 'description'}
        </button>
        <button className={has('perm') ? 'is-on' : ''} onClick={() => toggle('perm')}>
          <Chevron size={11} className="plus__chev" /> {tech === 'plain' ? 'safety check' : 'permission'}
        </button>
      </div>
      )}

      {has('desc') && (
        <section className="drop">
          <h4>{say('whatItDoes', tech)}</h4>
          <p>{step.resultNote ?? voice(step.spec.plain, tech)}</p>
          {step.spec.tool && tech !== 'plain' && <code>{step.spec.tool}</code>}
        </section>
      )}

      {has('perm') && (
        <section className="drop">
          <h4>{say('permissions', tech)}</h4>
          {step.spec.triggers.length ? (
            <ul className="drop__perms">
              {step.spec.triggers.map((t) => (
                <li key={t} className={[3, 4].includes(t) ? 'is-sacred' : ''}>
                  <span className="drop__n">{t}</span>
                  <span>{triggerText(t, tech)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="drop__ok">
              <Check size={12} /> {say('noRisk', tech)}
            </p>
          )}
          {sacred && (
            <p className="drop__sacred">
              <Lock size={12} /> <span>{say('sacred', tech)}</span>
            </p>
          )}
        </section>
      )}

      {/* Visual Impact Snapshot for stopping decisions */}
      {stops && d && step.state === 'blocked' && !selected && (
        <p className="card__hint">
          {cant ? <ShieldOff size={12} /> : check ? <Eye size={12} /> : <Alert size={12} />}
          {failed
            ? ' Something broke - open it to see which page.'
            : cant
            ? ' Waiting for you to do this part.'
            : check
              ? ' Waiting for you to take a look.'
              : step.spec.triggers.includes(3)
                ? ' Waiting for you - open it to see what else it changes.'
                : ' Waiting for you - open it to see what it does to your files.'}
        </p>
      )}

      {stops && d && selected && (
        <ImpactSnapshot
          decision={d}
          triggers={step.spec.triggers}
          tech={tech}
          onDataFiles={onDataFiles}
          onAdoptSafer={onAdoptSafer}
        />
      )}


      {askedInChat && step.state === 'blocked' && (
        <p className="card__hint is-chat">Waiting for your answer in the chat.</p>
      )}

      {(step.state === 'pending' || step.state === 'running') && !stops && !askedInChat && (
        <button className="card__pause" onClick={onPause}>
          <Pause size={12} /> pause this
        </button>
      )}

      {children}
    </article>
  )
}

function Status({ step }: { step: RunStep }) {
  switch (step.state) {
    case 'running':
      return <span className="pill pill--run"><span className="spinner" aria-hidden /> running</span>
    case 'done':
      if (step.outcome === 'counter') return <span className="pill pill--good"><Shield size={11} /> your call</span>
      if (step.outcome === 'approved')
        return step.spec.decision?.cantDo
          ? <span className="pill pill--ok"><Check size={11} /> you did this</span>
          : step.spec.decision?.failed
          ? <span className="pill pill--ok"><Check size={11} /> you chose</span>
          : step.spec.decision?.intended
          ? <span className="pill pill--ok"><Check size={11} /> you approved</span>
          : <span className="pill pill--bad"><Alert size={11} /> approved</span>
      return <span className="pill pill--ok"><Check size={11} /> done</span>
    case 'blocked':
      return <span className="pill pill--stop"><Alert size={11} /> waiting for you</span>
    case 'paused':
      return <span className="pill pill--hold"><Play size={11} /> paused</span>
    case 'reverted':
      return <span className="pill pill--gone"><X size={11} /> not run</span>
    default:
      return <span className="pill pill--idle">queued</span>
  }
}
