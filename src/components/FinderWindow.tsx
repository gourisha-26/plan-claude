import { useEffect, useRef, useState } from 'react'
import { PROJECT_TEMPLATES, type ProjectTemplate } from '../data/projects'
import { Chevron, Folder, Plus, Search, X } from './icons'

interface Props {
  isOpen: boolean
  currentProject: ProjectTemplate | null
  onSelectProject: (p: ProjectTemplate) => void
  onClose: () => void
}

/** macOS Blue Folder SVG graphic with authentic styling */
function MacFolderIcon({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 70 58" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="macFolderBack" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4bb0f7" />
          <stop offset="100%" stopColor="#1e78d6" />
        </linearGradient>
        <linearGradient id="macFolderFront" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5cc8ff" />
          <stop offset="35%" stopColor="#2b92ee" />
          <stop offset="100%" stopColor="#1662c9" />
        </linearGradient>
        <linearGradient id="macFolderSheet" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdfdfd" />
          <stop offset="100%" stopColor="#e4ecf7" />
        </linearGradient>
        <filter id="macFolderShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#0c356b" floodOpacity="0.32" />
        </filter>
      </defs>
      {/* Back tab and body */}
      <path
        d="M6 8a4 4 0 0 1 4-4h18l6 5h26a4 4 0 0 1 4 4v34a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V8Z"
        fill="url(#macFolderBack)"
      />
      {/* Paper sheets inside folder */}
      <rect x="14" y="11" width="42" height="18" rx="2" fill="url(#macFolderSheet)" opacity="0.9" />
      {/* Front flap with glossy gradient & drop shadow */}
      <path
        d="M6 18c0-2.2 1.8-4 4-4h50c2.2 0 4 1.8 4 4v31a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V18Z"
        fill="url(#macFolderFront)"
        filter="url(#macFolderShadow)"
      />
      {/* Subtle top edge highlight */}
      <path
        d="M10 15h50c1.7 0 3 1.3 3 3v0.5c0-1.7-1.3-3-3-3H10c-1.7 0-3 1.3-3 3V18c0-1.7 1.3-3 3-3Z"
        fill="#ffffff"
        opacity="0.35"
      />
    </svg>
  )
}

export function FinderWindow({ isOpen, currentProject, onSelectProject, onClose }: Props) {
  const [projects, setProjects] = useState<ProjectTemplate[]>(PROJECT_TEMPLATES)
  const [selectedId, setSelectedId] = useState<string>(() => currentProject?.id ?? PROJECT_TEMPLATES[0].id)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeSidebarItem, setActiveSidebarItem] = useState('projects')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const newFolderInputRef = useRef<HTMLInputElement>(null)

  // Keep selectedId updated if currentProject prop changes
  useEffect(() => {
    if (currentProject?.id) {
      setSelectedId(currentProject.id)
    }
  }, [currentProject])

  // Keyboard navigation: Escape to close, Enter to open
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'Enter' && !isCreatingFolder) {
        confirmSelection()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedId, projects, isCreatingFolder])

  useEffect(() => {
    if (isCreatingFolder) {
      newFolderInputRef.current?.focus()
    }
  }, [isCreatingFolder])

  if (!isOpen) return null

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.badge.toLowerCase().includes(q)
  })

  const selectedProject = projects.find((p) => p.id === selectedId) ?? projects[0]

  const confirmSelection = (target?: ProjectTemplate) => {
    const projectToOpen = target ?? selectedProject
    if (projectToOpen) {
      onSelectProject(projectToOpen)
      onClose()
    }
  }

  const handleCreateNewFolder = () => {
    const trimmed = newFolderName.trim()
    if (!trimmed) {
      setIsCreatingFolder(false)
      return
    }
    const newTemplate: ProjectTemplate = {
      id: `custom-${Date.now()}`,
      name: trimmed,
      description: 'Custom user workspace repository',
      type: 'custom',
      badge: 'Custom',
      files: ['src/index.ts', 'package.json', 'README.md'],
    }
    setProjects((prev) => [...prev, newTemplate])
    setSelectedId(newTemplate.id)
    setNewFolderName('')
    setIsCreatingFolder(false)
  }

  return (
    <div className="finder-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="win win--finder"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
        role="document"
      >
        {/* macOS Finder Toolbar & Titlebar */}
        <header className="finder__header">
          <div className="finder__traffic-lights">
            <button className="light light--r" onClick={onClose} title="Close" aria-label="Close Finder" />
            <button className="light light--y" onClick={onClose} title="Minimize" aria-label="Minimize Finder" />
            <button className="light light--g" title="Zoom" aria-label="Zoom Finder" />
          </div>

          <div className="finder__nav-group">
            <button className="finder__nav-btn" disabled title="Back">
              ‹
            </button>
            <button className="finder__nav-btn" disabled title="Forward">
              ›
            </button>
          </div>

          <div className="finder__path-badge">
            <Folder size={14} className="finder__path-icon" />
            <strong>Projects</strong>
            <span className="finder__path-arrow">▾</span>
          </div>

          <div className="finder__toolbar-spacer" />

          {/* View mode segmented control */}
          <div className="finder__segmented">
            <button
              type="button"
              className={`finder__seg-btn${viewMode === 'grid' ? ' is-active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Icons View"
            >
              ⊞
            </button>
            <button
              type="button"
              className={`finder__seg-btn${viewMode === 'list' ? ' is-active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              ☰
            </button>
          </div>

          {/* Search box */}
          <div className="finder__search">
            <Search size={12} className="finder__search-icon" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="finder__search-clear" onClick={() => setSearchQuery('')}>
                <X size={11} />
              </button>
            )}
          </div>
        </header>

        {/* Finder Main Body (Sidebar + Content) */}
        <div className="finder__body">
          {/* macOS Frosted Sidebar */}
          <aside className="finder__sidebar">
            <div className="finder__sb-group">
              <span className="finder__sb-title">Favorites</span>
              <button
                type="button"
                className={`finder__sb-item${activeSidebarItem === 'projects' ? ' is-active' : ''}`}
                onClick={() => setActiveSidebarItem('projects')}
              >
                <span className="finder__sb-icon finder__sb-icon--folder">📁</span>
                <span className="finder__sb-label">Projects</span>
              </button>
              <button
                type="button"
                className={`finder__sb-item${activeSidebarItem === 'home' ? ' is-active' : ''}`}
                onClick={() => setActiveSidebarItem('home')}
              >
                <span className="finder__sb-icon">🏠</span>
                <span className="finder__sb-label">gourisha</span>
              </button>
              <button
                type="button"
                className={`finder__sb-item${activeSidebarItem === 'developer' ? ' is-active' : ''}`}
                onClick={() => setActiveSidebarItem('developer')}
              >
                <span className="finder__sb-icon">💻</span>
                <span className="finder__sb-label">Developer</span>
              </button>
              <button
                type="button"
                className={`finder__sb-item${activeSidebarItem === 'documents' ? ' is-active' : ''}`}
                onClick={() => setActiveSidebarItem('documents')}
              >
                <span className="finder__sb-icon">📄</span>
                <span className="finder__sb-label">Documents</span>
              </button>
              <button
                type="button"
                className={`finder__sb-item${activeSidebarItem === 'downloads' ? ' is-active' : ''}`}
                onClick={() => setActiveSidebarItem('downloads')}
              >
                <span className="finder__sb-icon">⬇️</span>
                <span className="finder__sb-label">Downloads</span>
              </button>
              <button
                type="button"
                className={`finder__sb-item${activeSidebarItem === 'icloud' ? ' is-active' : ''}`}
                onClick={() => setActiveSidebarItem('icloud')}
              >
                <span className="finder__sb-icon">☁️</span>
                <span className="finder__sb-label">iCloud Drive</span>
              </button>
            </div>

            <div className="finder__sb-group">
              <span className="finder__sb-title">Locations</span>
              <button type="button" className="finder__sb-item">
                <span className="finder__sb-icon">🖥️</span>
                <span className="finder__sb-label">Macintosh HD</span>
              </button>
            </div>

            <div className="finder__sb-group">
              <span className="finder__sb-title">Tags</span>
              <button type="button" className="finder__sb-item">
                <span className="finder__sb-tag finder__sb-tag--blue" />
                <span className="finder__sb-label">Development</span>
              </button>
              <button type="button" className="finder__sb-item">
                <span className="finder__sb-tag finder__sb-tag--red" />
                <span className="finder__sb-label">Production</span>
              </button>
              <button type="button" className="finder__sb-item">
                <span className="finder__sb-tag finder__sb-tag--green" />
                <span className="finder__sb-label">Verified</span>
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="finder__main">
            {/* Breadcrumb banner */}
            <div className="finder__subhead">
              <div className="finder__crumb">
                <span>gourisha</span>
                <Chevron size={11} className="finder__crumb-sep" />
                <strong className="finder__crumb-active">Projects</strong>
              </div>
              <span className="finder__instruction">
                Select workspace for PLAN
              </span>
            </div>

            {/* View Mode: Grid (macOS Folder Icons) */}
            {viewMode === 'grid' ? (
              <div className="finder__grid">
                {filteredProjects.map((proj) => {
                  const isSelected = selectedId === proj.id
                  return (
                    <div
                      key={proj.id}
                      className={`finder__folder-item${isSelected ? ' is-selected' : ''}`}
                      onClick={() => setSelectedId(proj.id)}
                      onDoubleClick={() => confirmSelection(proj)}
                      title={`${proj.name} (${proj.badge}) - Double click to open`}
                    >
                      <div className="finder__folder-icon-wrap">
                        <MacFolderIcon size={64} />
                      </div>
                      <span className="finder__folder-name">{proj.name}</span>
                      <span className="finder__folder-tag">{proj.badge}</span>
                    </div>
                  )
                })}

                {/* Inline New Folder creation tile */}
                {isCreatingFolder ? (
                  <div className="finder__folder-item is-selected">
                    <div className="finder__folder-icon-wrap">
                      <MacFolderIcon size={64} />
                    </div>
                    <input
                      ref={newFolderInputRef}
                      type="text"
                      className="finder__folder-inline-input"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={handleCreateNewFolder}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateNewFolder()
                        if (e.key === 'Escape') setIsCreatingFolder(false)
                      }}
                      placeholder="untitled folder"
                    />
                  </div>
                ) : (
                  <div
                    className="finder__folder-item finder__folder-item--new"
                    onClick={() => {
                      setIsCreatingFolder(true)
                      setNewFolderName('custom-project')
                    }}
                    title="Create a new folder"
                  >
                    <div className="finder__folder-icon-wrap finder__folder-icon-wrap--add">
                      <Plus size={26} />
                    </div>
                    <span className="finder__folder-name">New Folder</span>
                    <span className="finder__folder-tag">Custom</span>
                  </div>
                )}
              </div>
            ) : (
              /* View Mode: List */
              <div className="finder__list">
                <div className="finder__list-head">
                  <span className="finder__col-name">Name</span>
                  <span className="finder__col-badge">Tech Stack</span>
                  <span className="finder__col-files">Files</span>
                  <span className="finder__col-date">Date Modified</span>
                </div>
                <div className="finder__list-body">
                  {filteredProjects.map((proj) => {
                    const isSelected = selectedId === proj.id
                    return (
                      <div
                        key={proj.id}
                        className={`finder__list-row${isSelected ? ' is-selected' : ''}`}
                        onClick={() => setSelectedId(proj.id)}
                        onDoubleClick={() => confirmSelection(proj)}
                      >
                        <div className="finder__col-name">
                          <span className="finder__row-icon">📁</span>
                          <strong>{proj.name}</strong>
                        </div>
                        <div className="finder__col-badge">
                          <span className="finder__badge-pill">{proj.badge}</span>
                        </div>
                        <div className="finder__col-files">
                          {proj.files.length} items
                        </div>
                        <div className="finder__col-date">
                          Today, 08:45 AM
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Inspector / Summary of Selected Item */}
            {selectedProject && (
              <div className="finder__inspector">
                <div className="finder__inspector-left">
                  <Folder size={13} className="finder__inspector-icon" />
                  <strong>{selectedProject.name}</strong>
                  <span className="finder__inspector-desc">
                    {selectedProject.description}
                  </span>
                </div>
                <div className="finder__inspector-files">
                  {selectedProject.files.slice(0, 3).map((f) => (
                    <span key={f} className="finder__file-chip">{f}</span>
                  ))}
                  {selectedProject.files.length > 3 && (
                    <span className="finder__file-chip finder__file-chip--more">
                      +{selectedProject.files.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>

        {/* macOS Open Dialog Bottom Footer */}
        <footer className="finder__footer">
          <div className="finder__footer-left">
            <button
              type="button"
              className="finder__btn-new-folder"
              onClick={() => {
                setIsCreatingFolder(true)
                setNewFolderName('custom-project')
              }}
            >
              <Plus size={13} />
              New Folder
            </button>
            <span className="finder__footer-status">
              {projects.length} items, 142.8 GB available
            </span>
          </div>

          <div className="finder__footer-actions">
            <button type="button" className="finder__btn finder__btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="finder__btn finder__btn--primary"
              onClick={() => confirmSelection()}
            >
              Open
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
