import { useCallback, useEffect, useRef, useState } from 'react'
import { triggerText, voice } from '../data/copy'
import { TRIGGERS, bandOf, type TechLevel } from '../data/types'
import { SPEEDS, type RunStep, type Speed, type useRun } from '../lib/useRun'
import { asksInChat, stopsUser } from '../lib/plan'
import { ChatBox } from './ChatBox'
import { DataDrawer } from './DataDrawer'
import { FlowCard } from './FlowCard'
import { Check, Minus, Play, Plus, Sparkle, Target, X } from './icons'

type Run = ReturnType<typeof useRun>

const BAND_LABEL = { low: 'checks often', balanced: 'checks before changes', high: 'checks rarely' } as const
const TECH_LABEL = { plain: 'everyday words', semi: 'knows a little code', technical: 'codes' } as const

const ZOOM_MIN = 0.5
const ZOOM_MAX = 1.6
const clampZoom = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(z * 100) / 100))

export function PlanPanel({ run, onEditSettings }: { run: Run; onEditSettings: () => void }) {
  const [showRule, setShowRule] = useState(false)
  const [zoom, setZoom] = useState(1)
  const flowRef = useRef<HTMLDivElement>(null)

  const nudgeZoom = useCallback((by: number) => setZoom((z) => clampZoom(z + by)), [])

  /* ctrl/⌘ + wheel zooms the canvas, the way every node editor does. Passive listeners
     cannot preventDefault, so this is attached by hand rather than via onWheel. */
  useEffect(() => {
    const el = flowRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      setZoom((z) => clampZoom(z - e.deltaY * 0.0015))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  /* drag the empty canvas to pan, but never steal a drag that started on a card */
  useEffect(() => {
    const el = flowRef.current
    if (!el) return
    let from: { x: number; y: number; left: number; top: number } | null = null
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('.card, .lane__mark, .endcap')) return
      from = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }
      el.setPointerCapture(e.pointerId)
      el.classList.add('is-panning')
    }
    const move = (e: PointerEvent) => {
      if (!from) return
      el.scrollLeft = from.left - (e.clientX - from.x)
      el.scrollTop = from.top - (e.clientY - from.y)
    }
    const up = () => {
      from = null
      el.classList.remove('is-panning')
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', up)
    }
  }, [])

  const drawerStep = run.drawer ? run.steps.find((s) => s.key === run.drawer!.key) ?? null : null
  const { tech, trust } = run.settings

  useEffect(() => {
    flowRef.current?.querySelector('.is-running, .is-blocked')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [run.cursor, run.status])

  if (!run.scenario) return null

  const stopping = run.steps.filter((s) => stopsUser(s.spec, run.settings) && !asksInChat(s.spec) && !s.discarded && s.state !== 'done').length
  const done = run.steps.filter((s) => s.state === 'done').length

  const hasBranch = run.steps.some((s) => s.branch === 'abandoned' || s.branch === 'diverged')
  const stemSteps = hasBranch ? run.steps.filter((s) => !s.branch || s.branch === 'main') : run.steps
  const abandonedSteps = hasBranch ? run.steps.filter((s) => s.branch === 'abandoned') : []
  const divergedSteps = hasBranch ? run.steps.filter((s) => s.branch === 'diverged') : []

  const renderCard = (s: RunStep, i: number, isAbandonedLane = false) => {
    // basic questions are asked in the chat; the plan only stops you for the risky steps
    const inChat = asksInChat(s.spec)
    const stops = stopsUser(s.spec, run.settings) && !s.discarded && !inChat
    const selected = run.openNode === s.key
    const isCurrent = i === run.cursor
    const isLive = s.state === 'blocked'

    // numbered as the canvas numbers them, so "go back to step 2" means the card marked 2
    const rewindTargets = run.steps
      .slice(0, i)
      .map((prev, idx) => ({ prev, idx }))
      .filter(({ prev }) => prev.state === 'done' && !prev.discarded)
      .map(({ prev, idx }) => ({ key: prev.key, index: idx + 1, title: prev.spec.title }))

    return (
      <FlowCard
        key={s.key}
        step={s}
        index={i}
        tech={tech}
        progress={isCurrent ? run.progress : 0}
        stops={stops}
        askedInChat={inChat}
        selected={selected}
        onSelect={() => run.setOpenNode(selected ? null : s.key)}
        onDataFiles={() => run.openDrawer(s.key)}
        onPause={() => run.pauseStep(s.key)}
        onSkip={run.skip}
        onAdoptSafer={
          s.spec.decision && !isAbandonedLane
            ? () => {
                const dec = { type: 'feedback' as const, text: voice(s.spec.decision!.safer.label, tech) }
                // decided now if the run is waiting here; otherwise it waits on the card for the run to arrive
                if (isLive) run.decideNow(s.key, dec)
                else run.queueDecision(s.key, dec)
              }
            : undefined
        }
      >
        {stops && selected && !isAbandonedLane && s.spec.decision && (
          <ChatBox
            step={s}
            index={i}
            tech={tech}
            isLive={isLive}
            rewindTargets={rewindTargets}
            chat={run.chats[s.key] ?? []}
            onPush={(from, text, tone) => run.pushChat(s.key, from, text, tone)}
            onSubmit={(dec) => {
              if (isLive) run.decideNow(s.key, dec)
              else run.queueDecision(s.key, dec)
            }}
            onClearQueued={() => run.clearQueued(s.key)}
          />
        )}
      </FlowCard>
    )
  }

  return (
    <section className={`panel${run.drawer ? ' is-drawer' : ''}`} aria-label="Plan">
      <header className="panel__head">
        <div className="panel__brand">
          <span className="panel__logo" aria-hidden><Sparkle size={14} /></span>
          <div>
            <h2>Plan · {run.scenario.chip}</h2>
            <p>{done === run.steps.length && run.status === 'done' ? 'Finished' : 'Safe steps run on their own. Risky ones wait for you.'}</p>
          </div>
        </div>
        <div className="panel__meta">
          <button className="panel__prefs" onClick={onEditSettings} title="Change how I explain things and how often I ask">
            <span className={`dotband is-${bandOf(trust)}`} aria-hidden />
            {BAND_LABEL[bandOf(trust)]} · {TECH_LABEL[tech]}
          </button>
          <span className="panel__count">{done}/{run.steps.length}</span>
          <button className={`panel__rule${stopping === 0 ? ' is-quiet' : ''}`} onClick={() => setShowRule((v) => !v)}>
            {stopping === 0
              ? (tech === 'plain' ? 'Safety rules' : 'The risk rule')
              : `${stopping} will stop you`}
          </button>
        </div>
      </header>

      {showRule && (
        <div className="rulebook">
          <div className="rulebook__head">
            <h3>{tech === 'plain' ? 'A step stops and asks you if:' : 'A step stops you if any of these are true'}</h3>
            <button onClick={() => setShowRule(false)} aria-label="Close"><X size={14} /></button>
          </div>
          <ul>
            {Object.values(TRIGGERS).map((t) => (
              <li key={t.id} className={[3, 4].includes(t.id) ? 'is-sacred' : ''}>
                <span className="rulebook__n">{t.id}</span>
                <span className="rulebook__label">{triggerText(t.id, tech)}</span>
              </li>
            ))}
          </ul>
          <p className="rulebook__foot">
            {tech === 'plain' ? (
              'Rules 3 and 4 are safety locks. They will always stop and ask you, no matter what.'
            ) : (
              <>
                Triggers <strong>3</strong> and <strong>4</strong> are sacred. Your trust slider moves the others; it never
                moves these.
              </>
            )}
          </p>
        </div>
      )}

      {/* The toolbar floats over the canvas, not over the panel - otherwise the paused
          bar (a panel-level sibling) slides underneath it and swallows Resume. */}
      <div className="canvas">
      <div className="flow" ref={flowRef} style={{ ['--z' as string]: zoom }}>
        <div className="flow__col">
          {!hasBranch ? (
            run.steps.map((s, i) => {
              const prev = run.steps[i - 1]
              const dead = s.discarded || prev?.discarded
              return (
                <div className="lane" key={s.key}>
                  {i > 0 && <span className={`vwire${dead ? ' is-dead' : ''}${s.state === 'running' ? ' is-live' : ''}`} aria-hidden />}
                  {s.discarded && !prev?.discarded && <span className="lane__mark is-dead">'old plan'</span>}
                  {!s.discarded && prev?.discarded && <span className="lane__mark is-live">'new plan'</span>}
                  {renderCard(s, i)}
                </div>
              )
            })
          ) : (
            <>
              {stemSteps.map((s, i) => (
                <div className="lane" key={s.key}>
                  {i > 0 && <span className={`vwire${s.state === 'running' ? ' is-live' : ''}`} aria-hidden />}
                  {renderCard(s, i)}
                </div>
              ))}

              <div className="branch-fork">
                <span className="vwire" aria-hidden />
                <div className="branch-fork__badge">
                  <Sparkle size={12} /> The plan changed - old plan vs new plan
                </div>
                <div className="branch-fork__wires" aria-hidden>
                  <svg viewBox="0 0 400 38" preserveAspectRatio="none" className="branch-svg">
                    <path d="M 200 0 C 200 22, 100 16, 100 38" fill="none" stroke="rgba(206, 62, 45, 0.45)" strokeWidth="2.5" strokeDasharray="5 4" />
                    <path d="M 200 0 C 200 22, 300 16, 300 38" fill="none" stroke="var(--d-ok)" strokeWidth="3" />
                  </svg>
                </div>
              </div>

              <div className="branch-grid">
                <div className="branch-lane branch-lane--abandoned">
                  <div className="branch-lane__header">
                    <span className="branch-lane__tag is-abandoned">
                      <X size={11} /> Old plan
                    </span>
                    <span className="branch-lane__sub">Never ran - you changed it</span>
                  </div>
                  <div className="branch-lane__cards">
                    {abandonedSteps.map((s, ai) => (
                      <div className="branch-step-wrap" key={s.key}>
                        {ai > 0 && <span className="vwire is-dead" aria-hidden />}
                        {renderCard(s, stemSteps.length + ai, true)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="branch-lane branch-lane--diverged">
                  <div className="branch-lane__header">
                    <span className="branch-lane__tag is-diverged">
                      <Check size={11} /> New plan
                    </span>
                    <span className="branch-lane__sub">Built from your words</span>
                  </div>
                  <div className="branch-lane__cards">
                    {divergedSteps.map((s, di) => (
                      <div className="branch-step-wrap" key={s.key}>
                        {di > 0 && <span className={`vwire${s.state === 'running' ? ' is-live' : ''}`} aria-hidden />}
                        {renderCard(s, stemSteps.length + abandonedSteps.length + di)}
                      </div>
                    ))}
                    {run.status === 'done' && (
                      <div className="branch-step-wrap" style={{ marginTop: 12 }}>
                        <span className="vwire" aria-hidden />
                        <div className={`endcap${run.finalOutcome === 'approve' ? ' is-bad' : ''}`}>
                          <strong>{run.finalOutcome === 'approve' ? 'Finished - and it cost you' : 'Finished - nothing you meant to keep was lost'}</strong>
                          <ChangeSummary steps={run.steps} tech={tech} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {!hasBranch && run.status === 'done' && (
            <div className="lane">
              <span className="vwire" aria-hidden />
              <div className={`endcap${run.finalOutcome === 'approve' ? ' is-bad' : ''}`}>
                <strong>
                  {run.finalOutcome === 'approve'
                    ? 'Finished - and it cost you'
                    : 'Finished - nothing you meant to keep was lost'}
                </strong>
                <ChangeSummary steps={run.steps} tech={tech} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tools">
        <div className="speed" role="group" aria-label="Playback speed">
          {SPEEDS.map((sp) => (
            <button key={sp} className={run.speed === sp ? 'is-on' : ''} onClick={() => run.setSpeed(sp as Speed)} aria-pressed={run.speed === sp}>
              {sp}×
            </button>
          ))}
        </div>
        <div className="zoom" role="group" aria-label="Zoom">
          <button onClick={() => nudgeZoom(-0.1)} disabled={zoom <= ZOOM_MIN} aria-label="Zoom out"><Minus size={13} /></button>
          <button className="zoom__pct" onClick={() => setZoom(1)} title="Reset to 100%">{Math.round(zoom * 100)}%</button>
          <button onClick={() => nudgeZoom(0.1)} disabled={zoom >= ZOOM_MAX} aria-label="Zoom in"><Plus size={13} /></button>
          <button
            onClick={() => {
              setZoom(1)
              flowRef.current?.querySelector('.is-running, .is-blocked, .card')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            }}
            aria-label="Recentre"
          >
            <Target size={13} />
          </button>
        </div>
      </div>
      </div>

      {run.status === 'paused' && (
        <div className="bar bar--hold">
          <span>You paused a step. Nothing is running.</span>
          <button className="btn btn--primary btn--sm" onClick={run.resume}><Play size={13} /> Resume</button>
        </div>
      )}


      {drawerStep && run.drawer && (
        <DataDrawer
          step={drawerStep}
          tech={tech}
          phase={run.drawer.phase}
          onGenerate={() => run.generateDummy(drawerStep.key)}
          onExecute={() => {
            run.closeDrawer()
            run.setOpenNode(drawerStep.key)
            run.pushChat(drawerStep.key, 'ai', `You’ve seen what it did to the copy. To run it on your real files, type “${drawerStep.spec.decision?.confirmPhrase}” below.`, 'warn')
          }}
          onCancel={() => {
            run.closeDrawer()
            run.setOpenNode(drawerStep.key)
            run.pushChat(drawerStep.key, 'ai', 'Cancelled - nothing was run on your real files. Tell me what should happen instead.', 'good')
          }}
          onClose={run.closeDrawer}
        />
      )}
    </section>
  )
}

/** After: a summary of every change, in the order it happened. */
function ChangeSummary({ steps, tech }: { steps: RunStep[]; tech: TechLevel }) {
  const ran = steps.filter((s) => s.state === 'done' && !s.discarded)
  return (
    <>
      <p>Every change, in order:</p>
      <ol className="endcap__list">
        {ran.map((s) => (
          <li
            key={s.key}
            className={s.outcome === 'approved' ? (s.spec.decision?.intended ? 'is-yours' : 'is-approved') : s.outcome === 'counter' ? 'is-yours' : ''}
          >
            <span>{s.resultTitle ?? (tech === 'plain' ? s.spec.plainTitle ?? s.spec.title : s.spec.title)}</span>
            {s.outcome === 'approved' && <em>{s.spec.decision?.cantDo ? 'you did this' : s.spec.decision?.failed ? 'you chose' : 'you approved'}</em>}
            {s.outcome === 'counter' && <em>your call</em>}
          </li>
        ))}
      </ol>
    </>
  )
}
