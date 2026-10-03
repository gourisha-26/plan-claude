import type { Evidence, PersonRecord } from '../data/types'
import { Alert, Check, Question, ShieldOff, Users, X } from './icons'

function RecordCard({ r, side }: { r: PersonRecord; side: 'l' | 'r' }) {
  return (
    <div className={`rec rec--${side}`}>
      <div className="rec__head">
        <span className="rec__name">{r.name}</span>
        <span className="rec__meta">{r.meta}</span>
      </div>
      <dl className="rec__fields">
        {r.fields.map((f) => (
          <div key={f.label} className={`rec__row${f.conflict ? ' is-conflict' : ''}`}>
            <dt>{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function EvidenceBlock({ ev, onKeep }: { ev: Evidence; onKeep?: () => void }) {
  if (ev.kind === 'variants') {
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <ul className="variants">
          {ev.variants.map((v) => (
            <li key={v.label} className={`variant is-${v.style}`}>
              <span className="variant__phone" aria-hidden>
                <span className="variant__head">
                  <i className="variant__logo" />
                  {v.style === 'burger' ? (
                    <b className="variant__burger">☰</b>
                  ) : (
                    <span className="variant__links">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <i key={i} />
                      ))}
                    </span>
                  )}
                </span>
                <i className="variant__title" />
                <i className="variant__img" />
              </span>
              <span className="variant__label">{v.label}</span>
              <span className="variant__detail">{v.detail}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (ev.kind === 'screens') {
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <ul className="screens">
          {ev.screens.map((sc) => (
            <li key={sc.name} className={`screen${sc.asked ? ' is-asked' : ''}`}>
              <span className="screen__view" aria-hidden>
                <i className="screen__bar" />
                <i className="screen__text" />
                <i className="screen__btn" />
              </span>
              <span className="screen__name">{sc.name}</span>
              <span className="screen__tag">{sc.asked ? 'You asked' : 'Also changes'}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (ev.kind === 'pages') {
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <ul className="phones">
          {ev.pages.map((p) => (
            <li key={p.name} className={`phone${p.ok ? '' : ' is-broken'}`}>
              <span className="phone__screen" aria-hidden>
                <i className="phone__head" />
                <i className="phone__title" />
                <i className="phone__img" />
              </span>
              <span className="phone__name">
                {p.ok ? <Check size={11} /> : <X size={11} />} {p.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (ev.kind === 'site') {
    const TAG = { new: 'New', updated: 'Updated', removed: 'Removed', same: 'No change' } as const
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <div className="site">
          <div className="site__bar" aria-hidden>
            <i />
            <i />
            <i />
            <span className="site__url">{ev.url}</span>
          </div>
          <ul className="site__pages">
            {ev.pages.map((p) => (
              <li key={p.name} className={`site__page is-${p.change}${p.asked ? ' is-asked' : ''}`}>
                <span className="site__name">
                  {p.name}
                  {p.asked && <em className="site__mark is-asked">You asked</em>}
                  {p.unfinished && <em className="site__mark">Not finished</em>}
                </span>
                <span className="site__tag">{TAG[p.change]}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="site__verdict">{ev.verdict}</p>
      </div>
    )
  }

  if (ev.kind === 'images') {
    const flagged = ev.items.filter((i) => i.flagged).length
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <ul className="imgs">
          {ev.items.map((it) => (
            <li key={it.name} className={`imgs__item${it.flagged ? ' is-flagged' : ''}`}>
              <span className="imgs__thumb" style={{ ['--h' as string]: it.hue }} aria-hidden>
                {it.flagged ? (
                  <>
                    <i className="imgs__shape imgs__shape--a" />
                    <i className="imgs__shape imgs__shape--b" />
                    <b className="imgs__res">4K</b>
                  </>
                ) : (
                  <>
                    <i className="imgs__bar" />
                    <i className="imgs__line" />
                    <i className="imgs__line imgs__line--short" />
                  </>
                )}
              </span>
              <span className="imgs__name">{it.name}</span>
              <span className="imgs__note">{it.note}</span>
            </li>
          ))}
        </ul>
        {ev.more && <p className="imgs__more">{ev.more}</p>}
        <div className={`imgs__verdict${flagged ? ' is-flagged' : ''}`}>
          {flagged ? <Alert size={14} /> : <Check size={14} />}
          <p>{ev.verdict}</p>
          {flagged > 0 && onKeep && (
            <button type="button" className="imgs__keep" onClick={onKeep}>
              <Check size={12} /> Keep them
            </button>
          )}
        </div>
      </div>
    )
  }

  if (ev.kind === 'pairs') {
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        {ev.pairs.map((p, i) => (
          <div key={i} className={`pair${p.same ? ' is-same' : ''}`}>
            <div className="pair__grid">
              <RecordCard r={p.left} side="l" />
              <div className="pair__op" aria-hidden>
                <span className="pair__opmark">{p.same ? '=' : '≠'}</span>
              </div>
              <RecordCard r={p.right} side="r" />
            </div>
            <p className={`pair__verdict${p.same ? ' is-same' : ''}`}>
              {p.same ? <Check size={14} /> : <Alert size={14} />}
              <span>{p.verdict}</span>
            </p>
          </div>
        ))}
      </div>
    )
  }

  if (ev.kind === 'group') {
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <div className="grp">
          <div className="grp__key">
            <Users size={15} />
            <div>
              <span className="grp__keylabel">{ev.sharedLabel}</span>
              <span className="grp__keyvalue">{ev.sharedValue}</span>
            </div>
            <span className="grp__count">{ev.members.length} people</span>
          </div>
          <ul className="grp__list">
            {ev.members.map((m) => (
              <li key={m.name}>
                <span className="grp__name">{m.name}</span>
                <span className="grp__role">{m.role}</span>
                <span className="grp__detail">{m.detail}</span>
              </li>
            ))}
          </ul>
          <p className="grp__verdict">
            <Alert size={14} />
            <span>{ev.verdict}</span>
          </p>
        </div>
      </div>
    )
  }

  if (ev.kind === 'schema') {
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <div className="sch">
          <div className="sch__head">
            <span className="sch__table">{ev.table}</span>
            <span className="sch__rows">{ev.rows}</span>
          </div>
          <ul className="sch__cols">
            {ev.columns.map((c) => (
              <li key={c.name} className={`sch__col is-${c.fate}`}>
                <span className="sch__fate" aria-hidden>
                  {c.fate === 'destroyed' ? <X size={13} /> : c.fate === 'added' ? '+' : <Check size={13} />}
                </span>
                <span className="sch__name">{c.name}</span>
                <span className="sch__sample">{c.sample}</span>
                <span className="sch__tag">
                  {c.fate === 'destroyed' ? 'not carried over' : c.fate === 'added' ? 'new' : 'kept'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  if (ev.kind === 'setting') {
    return (
      <div className="ev">
        <p className="ev__caption">{ev.caption}</p>
        <div className="set">
          <div className="set__name">
            <ShieldOff size={15} />
            {ev.setting}
          </div>
          <div className="set__swap">
            <div className="set__state is-before">
              <span className="set__label">Now</span>
              <span className="set__value">{ev.before}</span>
            </div>
            <span className="set__arrow" aria-hidden>→</span>
            <div className="set__state is-after">
              <span className="set__label">After this step</span>
              <span className="set__value">{ev.after}</span>
            </div>
          </div>
          <p className="set__history">
            <Alert size={14} />
            <span>{ev.history}</span>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="ev">
      <p className="ev__caption">{ev.caption}</p>
      <ul className="proof">
        {ev.rows.map((r) => (
          <li key={r.label} className={`proof__row is-${r.status}`}>
            <span className="proof__icon" aria-hidden>
              {r.status === 'ok' ? <Check size={14} /> : r.status === 'bad' ? <X size={14} /> : <Question size={14} />}
            </span>
            <span className="proof__label">{r.label}</span>
            <span className="proof__value">{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
