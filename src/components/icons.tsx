type P = { size?: number; className?: string }

const base = (size: number, className?: string) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  className,
  'aria-hidden': true,
  focusable: false,
})

export const Check = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M20 6 9 17l-5-5" /></svg>
)
export const X = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const Lock = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="4" y="10.5" width="16" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
)
export const Alert = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4.5M12 17.2h.01" />
  </svg>
)
export const Pause = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M9 5v14M15 5v14" /></svg>
)
export const Play = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M7 4.8v14.4l12-7.2z" /></svg>
)
export const Rewind = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M3 9.5h6.5M3 9.5V3" />
    <path d="M4.6 15.2A8.5 8.5 0 1 0 6.4 6.4L3 9.5" />
  </svg>
)
export const Eye = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)
export const Shield = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3 5 6v6c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
)
export const ShieldOff = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M12 3 5 6v6c0 4.2 2.9 7.7 7 9 4.1-1.3 7-4.8 7-9V6l-7-3Z" />
    <path d="m9.5 9.5 5 5M14.5 9.5l-5 5" />
  </svg>
)
export const Arrow = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M4.5 12h14M13 6.5l5.5 5.5L13 17.5" /></svg>
)
export const Chevron = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="m9 5 7 7-7 7" /></svg>
)
export const Question = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.2-2.5 3.8M12 17h.01" />
  </svg>
)
export const Dot = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" /></svg>
)
export const Mic = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
  </svg>
)
export const Plus = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M12 5.5v13M5.5 12h13" /></svg>
)
export const Folder = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h6.5a1.5 1.5 0 0 1 1.5 1.5v8.5a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5Z" />
  </svg>
)
export const Laptop = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="4" y="5.5" width="16" height="10" rx="1.5" />
    <path d="M2.5 18.5h19" />
  </svg>
)
export const Wifi = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M2.5 9a14 14 0 0 1 19 0M6 12.5a9 9 0 0 1 12 0M9.5 16a4 4 0 0 1 5 0M12 19.2h.01" />
  </svg>
)
export const Battery = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="2.5" y="8" width="16" height="8" rx="2" />
    <path d="M21 11v2" />
    <rect x="4.5" y="10" width="9" height="4" rx="1" fill="currentColor" stroke="none" />
  </svg>
)
export const Search = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
)
export const Sidebar = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M10 5v14" />
  </svg>
)
export const Split = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="3.5" y="5" width="17" height="14" rx="2.5" /><path d="M14 5v14" />
  </svg>
)
export const Users = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19c.6-3 2.9-4.6 5.5-4.6S13.9 16 14.5 19" />
    <path d="M16 5.4a3.2 3.2 0 0 1 0 6M17.5 14.8c2 .5 3.4 2 3.9 4.2" />
  </svg>
)
export const Table = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M3.5 9.5h17M9.5 9.5v10" />
  </svg>
)
export const Sparkle = ({ size = 16, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
    <path d="M12 2.2c.3 3.4 1.2 5.5 2.6 6.9 1.4 1.4 3.5 2.2 6.9 2.6v.6c-3.4.3-5.5 1.2-6.9 2.6-1.4 1.4-2.2 3.5-2.6 6.9h-.6c-.3-3.4-1.2-5.5-2.6-6.9-1.4-1.4-3.5-2.2-6.9-2.6v-.6c3.4-.3 5.5-1.2 6.9-2.6C10.2 7.7 11 5.6 11.4 2.2Z" />
  </svg>
)

/* ---------- autonomy levels ---------- */
export const Rocket = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09Z" />
    <path d="M12 15 9 12c.68-1.95 1.92-3.76 3.62-5.28C15.16 4.42 18.4 3.4 21.5 3.5c.1 3.1-.92 6.34-3.22 8.88C16.76 14.08 14.95 15.32 13 16Z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
)
export const Target = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
  </svg>
)

/* ---------- sidebar ---------- */
export const Home = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /></svg>
)
export const Code = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="m9 17-5-5 5-5M15 7l5 5-5 5" /></svg>
)
export const Clock = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5.2l3.2 2" /></svg>
)
export const Minus = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M5 12h14" /></svg>
)
export const Book = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19v15.5H5.5A1.5 1.5 0 0 0 4 20z" />
    <path d="M4 20a1.5 1.5 0 0 1 1.5-1.5H19V21H5.5A1.5 1.5 0 0 1 4 19.5z" />
  </svg>
)
export const Sun = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
  </svg>
)
export const Moon = ({ size = 16, className }: P) => (
  <svg {...base(size, className)}><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>
)
