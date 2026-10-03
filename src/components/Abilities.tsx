import { Check, Eye, Lock, ShieldOff } from './icons'

type Icon = (p: { size?: number; className?: string }) => JSX.Element

/**
 * The agent-abilities card, shown at the start of every session. No hidden powers: what it
 * does on its own, what it shows you first, where it always asks, and what it never does.
 */
const TILES: { tone: string; label: string; items: string; Icon: Icon }[] = [
  { tone: 'can', label: 'I do these without asking', items: 'Text, colors, layout', Icon: Check },
  { tone: 'preview', label: 'I show you first', items: 'Big changes, or many files at once', Icon: Eye },
  { tone: 'ask', label: 'I always stop and ask', items: 'Deleting, publishing, paying', Icon: Lock },
  { tone: 'cant', label: 'I never do these', items: 'Anything outside this project', Icon: ShieldOff },
]

export function Abilities({ project }: { project?: string }) {
  return (
    <section className="abil" aria-label="My rules in this project">
      <h2 className="abil__head">
        How I work in <em>{project ?? 'this project'}</em>
      </h2>
      <ul className="abil__grid">
        {TILES.map((t) => (
          <li key={t.tone} className={`abil__tile is-${t.tone}`}>
            <span className="abil__icon" aria-hidden>
              <t.Icon size={14} />
            </span>
            <span className="abil__label">{t.label}</span>
            <span className="abil__items">{t.items}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
