import type { useRun } from '../lib/useRun'
import { Book, Clock, Code, Home, Moon, Plus, Sun } from './icons'

type Run = ReturnType<typeof useRun>

const ago = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000))
  if (s < 60) return 'just now'
  const m = Math.round(s / 60)
  return m < 60 ? `${m}m ago` : `${Math.round(m / 60)}h ago`
}

/**
 * Claude Code's own sidebar. The session list is real - every scenario you start records
 * one, and clicking it re-opens that scenario.
 */
export type Theme = 'dark' | 'light'

export function Sidebar({
  run,
  onGuide,
  theme,
  onTheme,
}: {
  run: Run
  onGuide: () => void
  theme: Theme
  onTheme: (t: Theme) => void
}) {
  return (
    <aside className="sb" aria-label="Sessions">
      {/* as in Claude Code; this prototype only has the Code side, so Home is a label, not a button */}
      <div className="sb__seg">
        <span className="sb__segbtn is-static">
          <Home size={14} /> Home
        </span>
        <span className="sb__segbtn is-on" aria-current="page">
          <Code size={14} /> Code
        </span>
      </div>

      <button className="sb__new" onClick={run.reset}>
        <span className="sb__newicon" aria-hidden>
          <Plus size={13} />
        </span>
        New session
      </button>

      <nav className="sb__nav">
        <button className="sb__item sb__item--guide" onClick={onGuide}>
          <Book size={14} /> How to install
        </button>
      </nav>

      <p className="sb__label">
        <Clock size={11} /> Sessions
      </p>

      {run.sessions.length === 0 ? (
        <p className="sb__empty">Nothing yet. Enter a task to start a session.</p>
      ) : (
        <ul className="sb__list">
          {run.sessions.map((s) => {
            const scenario = s.scenario
            return (
              <li key={s.id}>
                <button
                  className={`sb__sess${s.id === run.sessionId ? ' is-on' : ''}`}
                  onClick={() => scenario && run.start(scenario)}
                >
                  <span className="sb__sesstitle">{s.title}</span>
                  <span className="sb__sesstime">{ago(s.at)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {/* light / dark, pinned to the bottom of the sidebar */}
      <div className="sb__theme" role="group" aria-label="Appearance">
        <button type="button" className={theme === 'light' ? 'is-on' : ''} aria-pressed={theme === 'light'} onClick={() => onTheme('light')}>
          <Sun size={13} /> Light
        </button>
        <button type="button" className={theme === 'dark' ? 'is-on' : ''} aria-pressed={theme === 'dark'} onClick={() => onTheme('dark')}>
          <Moon size={13} /> Dark
        </button>
      </div>
    </aside>
  )
}
