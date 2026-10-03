import { useState } from 'react'
import { ClaudeWindow } from './components/ClaudeWindow'
import type { Theme } from './components/Sidebar'
import { FinderWindow } from './components/FinderWindow'
import { InstallGuide } from './components/InstallGuide'
import { PlanPanel } from './components/PlanPanel'
import { ClaudeMark, DOCK_APPS } from './components/DockApps'
import { Battery, Search, Wifi } from './components/icons'
import { PROJECT_TEMPLATES, type ProjectTemplate } from './data/projects'
import { useRun } from './lib/useRun'

const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function App() {
  const run = useRun()
  const [editing, setEditing] = useState(false)
  const [guide, setGuide] = useState(false)
  const [finderOpen, setFinderOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<ProjectTemplate | null>(() => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem('selected_project_id')
    return PROJECT_TEMPLATES.find((p) => p.id === stored) ?? null
  })
  // light or dark, for the Claude Code windows; remembered in this browser when storage allows
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return localStorage.getItem('plan-theme') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const changeTheme = (t: Theme) => {
    setTheme(t)
    try {
      localStorage.setItem('plan-theme', t)
    } catch {
      /* storage unavailable - the choice still applies for this visit */
    }
  }
  const now = new Date()
  const open = !!run.scenario

  const handleSelectProject = (project: ProjectTemplate) => {
    setSelectedProject(project)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected_project_id', project.id)
    }
  }

  return (
    <div className="desk">
      <div className="desk__wall" aria-hidden />
      <div className="desk__glow" aria-hidden />

      <div className="menubar">
        <span className="menubar__logo" aria-hidden></span>
        <strong>Claude Code</strong>
        <span>File</span>
        <span>Edit</span>
        <span>Session</span>
        <span>Window</span>
        <span className="menubar__spacer" />
        <Battery size={16} />
        <Wifi size={15} />
        <Search size={14} />
        <span className="menubar__clock">
          {DAY[now.getDay()]} {now.getDate()} {now.toLocaleString('en', { month: 'short' })} &nbsp;
          {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
        </span>
      </div>

      <div className="widgets" aria-hidden>
        <div className="widget widget--batt">
          <div className="widget__ring" />
          <span className="widget__pct">25%</span>
        </div>
        <div className="widget widget--cal">
          <span className="widget__day">{DAY[now.getDay()].toUpperCase()}</span>
          <span className="widget__date">{now.getDate()}</span>
          <span className="widget__note">Claude Code workspace</span>
          <span className="widget__note widget__note--dim">PLAN active</span>
        </div>
      </div>

      <main className={`stage${open ? ' is-open' : ''}`} data-theme={theme}>
        <div className="win win--cc">
          <ClaudeWindow
            run={run}
            editing={editing}
            onCloseEditing={() => setEditing(false)}
            onGuide={() => setGuide(true)}
            selectedProject={selectedProject}
            onOpenFinder={() => setFinderOpen(true)}
            theme={theme}
            onTheme={changeTheme}
          />
        </div>
        {open && (
          <div className="win win--panel">
            <PlanPanel run={run} onEditSettings={() => setEditing(true)} />
          </div>
        )}
      </main>

      {/* Simulated macOS Finder Window */}
      <FinderWindow
        isOpen={finderOpen}
        currentProject={selectedProject}
        onSelectProject={handleSelectProject}
        onClose={() => setFinderOpen(false)}
      />

      {guide && <InstallGuide onClose={() => setGuide(false)} />}

      <div className="dock">
        <span className="dock__app dock__app--claude" title="Claude Code" data-label="Claude Code">
          <ClaudeMark size={26} />
          <i className="dock__run" aria-hidden />
        </span>
        <span className="dock__sep" aria-hidden />
        {DOCK_APPS.map((a) => {
          const isFinder = a.id === 'finder'
          return (
            <span
              key={a.id}
              className="dock__app"
              style={{ background: a.tile }}
              title={a.label}
              data-label={a.label}
              onClick={() => {
                if (isFinder) setFinderOpen((v) => !v)
              }}
            >
              <a.Glyph size={26} />
              {isFinder && finderOpen && <i className="dock__run" aria-hidden />}
            </span>
          )
        })}
      </div>

    </div>
  )
}

