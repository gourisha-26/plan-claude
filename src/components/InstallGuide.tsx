import { useCallback, useEffect, useRef, useState } from 'react'
import { DONE, LINES, OUTCOME } from '../data/install'
import { Check, Rewind, X } from './icons'

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const TYPE_MS = 45      // per character - slow enough to read along with
const LINE_GAP = 500    // pause between lines

const TOTAL = LINES.reduce((n, l) => n + l.length, 0)

/**
 * "How you'd install it" - a presenter aid for people who don't write code.
 * One command, typed out, then what it means. The whole point is that the install is short.
 */
export function InstallGuide({ onClose }: { onClose: () => void }) {
  const [typed, setTyped] = useState(0)
  const [outcome, setOutcome] = useState(false)
  const timers = useRef<number[]>([])

  const clear = () => { timers.current.forEach(window.clearTimeout); timers.current = [] }

  const play = useCallback(() => {
    clear()
    if (reduced()) { setTyped(TOTAL); setOutcome(true); return }
    setTyped(0); setOutcome(false)

    let at = 400
    let before = 0
    for (const line of LINES) {
      const base = before
      for (let c = 1; c <= line.length; c++) {
        timers.current.push(window.setTimeout(() => setTyped(base + c), at + c * TYPE_MS))
      }
      at += line.length * TYPE_MS + LINE_GAP
      before += line.length
    }
    timers.current.push(window.setTimeout(() => setOutcome(true), at))
  }, [])

  useEffect(() => { play(); return clear }, [play])

  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
      else if (e.key === ' ') { e.preventDefault(); play() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [play])

  const complete = typed >= TOTAL
  let budget = typed

  return (
    <div className="guide" role="dialog" aria-modal="true" aria-label="How you'd install it">
      <div className="guide__box guide__box--simple">
        <header className="guide__top">
          <div>
            <p className="guide__eyebrow">If this were real</p>
            <h2>How you’d install it</h2>
          </div>
          <div className="guide__top-actions">
            <button className="guide__play" onClick={play}>
              <Rewind size={13} /> Replay
            </button>
            <button className="guide__close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </header>

        <div className="ways ways--one">
          <section className={`way${complete ? ' is-done' : ''}`}>
            <p className="way__blurb">Type this in Claude Code:</p>
            <div className="term">
              <div className="term__body">
                {LINES.map((line, li) => {
                  const take = Math.max(0, Math.min(line.length, budget))
                  budget -= line.length
                  const started = take > 0 || li === 0
                  return (
                    <div className={`cmd${started ? ' is-on' : ''}`} key={li}>
                      <code>
                        <span className="cmd__mark">›</span>
                        {line.slice(0, take)}
                        {started && take < line.length && <span className="caret" />}
                      </code>
                    </div>
                  )
                })}
              </div>
              <div className={`term__done${complete ? ' is-on' : ''}`}>
                <Check size={13} /> {DONE}
              </div>
            </div>
          </section>
        </div>

        <footer className={`guide__foot${outcome ? ' is-on' : ''}`}>
          <p>{OUTCOME}</p>
        </footer>
      </div>
    </div>
  )
}
