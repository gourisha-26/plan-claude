/**
 * Dock icons.
 *
 * Generic macOS-shaped apps rather than any real vendor's mark - the desktop only has to
 * read as "a Mac with things open", and the one that matters - Claude Code - gets the brand.
 */

type G = { size?: number }

const sq = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 40 40',
  fill: 'none',
  'aria-hidden': true,
  focusable: false,
})

/* Each app is a glyph drawn on its own tile background, set in CSS by --tile. */

export const Finder = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <path d="M14 15v4M26 15v4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M13 26c4 2.6 10 2.6 14 0" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)

export const Browser = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <circle cx="20" cy="20" r="12" stroke="#fff" strokeWidth="2.2" opacity="0.9" />
    <path d="m25.5 14.5-3 8.2-8.2 3 3-8.2z" fill="#fff" />
  </svg>
)

export const Mail = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <rect x="8" y="12" width="24" height="16" rx="3.2" stroke="#fff" strokeWidth="2.2" />
    <path d="m9.5 14.5 10.5 8 10.5-8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const Messages = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <path
      d="M20 10c6.6 0 12 4.1 12 9.2S26.6 28.4 20 28.4a15 15 0 0 1-3.4-.4l-5.4 2.2 1.7-4A8.6 8.6 0 0 1 8 19.2C8 14.1 13.4 10 20 10Z"
      fill="#fff"
    />
  </svg>
)

export const Notes = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <rect x="10" y="8" width="20" height="24" rx="3" fill="#fff" opacity="0.96" />
    <path d="M14.5 16h11M14.5 20h11M14.5 24h7" stroke="#8a6d1f" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

export const Terminal = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <path d="m13 15 5 5-5 5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 26h6" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)

export const Settings = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <circle cx="20" cy="20" r="4.2" stroke="#fff" strokeWidth="2.2" />
    <path
      d="M20 8.5v3M20 28.5v3M31.5 20h-3M11.5 20h-3M28.1 11.9l-2.1 2.1M14 26l-2.1 2.1M28.1 28.1 26 26M14 14l-2.1-2.1"
      stroke="#fff"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
)

/** Claude Code - the same star the app uses in its own chrome. */
export const ClaudeMark = ({ size = 26 }: G) => (
  <svg {...sq(size)}>
    <path
      d="M20 8.5c.7 4.3 2.6 6.6 6.9 7.3l3.6.6-3.6.6c-4.3.7-6.2 3-6.9 7.3l-.6 3.6-.6-3.6c-.7-4.3-2.6-6.6-6.9-7.3l-3.6-.6 3.6-.6c4.3-.7 6.2-3 6.9-7.3l.6-3.6z"
      fill="#fff"
      transform="translate(0 4)"
    />
  </svg>
)

export type DockApp = { id: string; label: string; tile: string; Glyph: (p: G) => JSX.Element }

/** Order matters - this is the row the user reads left to right. */
export const DOCK_APPS: DockApp[] = [
  { id: 'finder', label: 'Finder', tile: 'linear-gradient(180deg,#4f9be0,#2a6bb0)', Glyph: Finder },
  { id: 'browser', label: 'Browser', tile: 'linear-gradient(180deg,#5fb2ea,#2b7fc4)', Glyph: Browser },
  { id: 'mail', label: 'Mail', tile: 'linear-gradient(180deg,#4a8fd4,#2f6bad)', Glyph: Mail },
  { id: 'messages', label: 'Messages', tile: 'linear-gradient(180deg,#63c96a,#37a04a)', Glyph: Messages },
  { id: 'notes', label: 'Notes', tile: 'linear-gradient(180deg,#f4d06a,#e0af35)', Glyph: Notes },
  { id: 'terminal', label: 'Terminal', tile: 'linear-gradient(180deg,#3d3d3a,#1f1e1d)', Glyph: Terminal },
  { id: 'settings', label: 'System Settings', tile: 'linear-gradient(180deg,#8d8c86,#5e5d59)', Glyph: Settings },
]
