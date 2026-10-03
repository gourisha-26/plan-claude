import { say } from '../data/copy'
import type { DataFile, TechLevel } from '../data/types'
import type { DrawerPhase, RunStep } from '../lib/useRun'
import { Alert, Check, Shield, Table, X } from './icons'

type Props = {
  step: RunStep
  tech: TechLevel
  phase: DrawerPhase
  onGenerate: () => void
  onExecute: () => void
  onCancel: () => void
  onClose: () => void
}

const KIND = {
  database: 'database',
  code: 'code',
  config: 'setting',
  files: 'files',
} as const

export function DataDrawer({ step, tech, phase, onGenerate, onExecute, onCancel, onClose }: Props) {
  const d = step.spec.decision
  if (!d) return null
  const files = d.dataFiles
  const destructive = files.filter((f) => f.destructive)

  return (
    <aside className="drawer" aria-label="Data files this step will change">
      <header className="drawer__head">
        <div>
          <span className="drawer__eyebrow">
            <Table size={11} /> {phase === 'preview' ? 'Test run on a copy' : 'Try it on a copy first'}
          </span>
          <h2>{step.spec.title}</h2>
        </div>
        <button className="drawer__close" onClick={onClose} aria-label="Close">
          <X size={15} />
        </button>
      </header>

      <div className="drawer__body">
        {phase === 'files' && (
          <>
            <p className="drawer__lead">
              {files.length} file{files.length === 1 ? '' : 's'} would change
              {destructive.length > 0 && (
                <>
                  {' '}- <b>{destructive.length}</b> of them destructively
                </>
              )}
              .
            </p>
            {files.map((f) => (
              <FileRow key={f.path} f={f} />
            ))}
            <div className="drawer__dummy">
              <p>{say('dummyExplain', tech)}</p>
              <button className="btn btn--primary" onClick={onGenerate}>
                Try it on a copy first
              </button>
            </div>
          </>
        )}

        {phase === 'generating' && (
          <div className="drawer__gen">
            <span className="spinner" aria-hidden />
            <p>Making a copy of your project and running it there…</p>
            <p className="drawer__genlist">
              {files.map((f) => (
                <span key={f.path}>{f.path}</span>
              ))}
            </p>
            <p className="drawer__note">Nothing real is being touched.</p>
          </div>
        )}

        {phase === 'preview' && (
          <>
            <p className="drawer__ran">
              <Check size={13} />
              <span>This ran on a copy. Your real files are untouched. Here’s exactly what it did.</span>
            </p>
            {d.testRun && (
              <ul className="testrun">
                {d.testRun.map((r) => (
                  <li key={r.label} className={r.flag ? 'is-flag' : ''}>
                    <span className="testrun__label">{r.label}</span>
                    <span className="testrun__value">{r.value}</span>
                  </li>
                ))}
              </ul>
            )}
            {files.map((f) => (
              <section key={f.path} className={`prev${f.destructive ? ' is-bad' : ''}`}>
                <header>
                  <span className="prev__path">{f.path}</span>
                  <span className="prev__scope">{f.scope}</span>
                </header>
                <div className="prev__diff">
                  {f.diff.map((l, i) => (
                    <span key={i} className={`dl dl--${l.type}`}>
                      <em aria-hidden>{l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}</em>
                      {l.text}
                    </span>
                  ))}
                </div>
                <p className={`prev__impact${f.destructive ? ' is-bad' : ''}`}>
                  {f.destructive ? <Alert size={13} /> : <Check size={13} />}
                  <span>{f.impact}</span>
                </p>
              </section>
            ))}
          </>
        )}
      </div>

      {phase === 'preview' && (
        <footer className="drawer__foot">
          <button className="btn btn--danger" onClick={onExecute}>
            <Alert size={14} /> Run on real files
          </button>
          <button className="btn btn--primary" onClick={onCancel}>
            <Shield size={14} /> Cancel and send feedback
          </button>
        </footer>
      )}
    </aside>
  )
}

function FileRow({ f }: { f: DataFile }) {
  return (
    <div className={`file${f.destructive ? ' is-bad' : ''}`}>
      <span className={`file__kind is-${f.kind}`}>{KIND[f.kind]}</span>
      <span className="file__path">{f.path}</span>
      <span className="file__note">{f.note}</span>
      <span className="file__scope">{f.scope}</span>
      {f.destructive && (
        <span className="file__warn">
          <Alert size={11} /> destructive
        </span>
      )}
    </div>
  )
}
