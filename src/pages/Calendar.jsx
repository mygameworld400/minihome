import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { EVENT_TYPES } from '../services/calendarService'
import Modal, { Confirm } from '../components/common/Modal'
import './calendar.css'

const WEEK = ['일', '월', '화', '수', '목', '금', '토']
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export default function Calendar() {
  const { events, tasks, tracks, addEvent, editEvent, removeEvent } = useStore()
  const [cur, setCur] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [pick, setPick] = useState(null)     // 클릭한 날짜 iso
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const y = cur.getFullYear()
  const m = cur.getMonth()
  const todayIso = iso(new Date())

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks])

  /* 날짜별 항목: 일정 + 마감일 있는 업무 */
  const byDate = useMemo(() => {
    const map = new Map()
    const push = (k, v) => { if (!map.has(k)) map.set(k, []); map.get(k).push(v) }
    events.forEach((e) => push(e.event_date, { kind: 'event', row: e }))
    tasks.forEach((t) => { if (t.due_date) push(t.due_date, { kind: 'task', row: t }) })
    return map
  }, [events, tasks])

  const cells = useMemo(() => {
    const first = new Date(y, m, 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i)
      return { date: d, iso: iso(d), inMonth: d.getMonth() === m }
    })
  }, [y, m])

  const dayItems = pick ? (byDate.get(pick) ?? []) : []

  return (
    <>
      <div className="page-head">
        <h1>📅 캘린더</h1>
        <div className="spacer row" style={{ gap: 6 }}>
          <button className="btn btn-sm" onClick={() => setCur(new Date(y, m - 1, 1))}>‹</button>
          <strong style={{ minWidth: 110, textAlign: 'center' }}>{y}년 {m + 1}월</strong>
          <button className="btn btn-sm" onClick={() => setCur(new Date(y, m + 1, 1))}>›</button>
          <button className="btn btn-sm btn-sky" onClick={() => { const d = new Date(); d.setDate(1); setCur(d) }}>오늘</button>
        </div>
      </div>

      <section className="card cal">
        <div className="cal-week">
          {WEEK.map((w, i) => (
            <div key={w} className={'cal-wd' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '')}>{w}</div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((c) => {
            const items = byDate.get(c.iso) ?? []
            const wd = c.date.getDay()
            return (
              <button
                key={c.iso}
                className={
                  'cal-cell' +
                  (c.inMonth ? '' : ' out') +
                  (c.iso === todayIso ? ' today' : '') +
                  (c.iso === pick ? ' picked' : '')
                }
                onClick={() => setPick(c.iso)}
              >
                <span className={'d' + (wd === 0 ? ' sun' : wd === 6 ? ' sat' : '')}>
                  {c.date.getDate()}
                </span>
                <span className="marks">
                  {items.slice(0, 3).map((it, i) => (
                    <i
                      key={i}
                      style={{
                        background: it.kind === 'event'
                          ? EVENT_TYPES[it.row.event_type]?.color ?? '#ddd'
                          : trackById.get(it.row.track_id)?.color ?? '#e0d4de',
                      }}
                    />
                  ))}
                  {items.length > 3 && <em>+{items.length - 3}</em>}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {pick && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2 className="card-title">
            🗓 {pick}
            <button
              className="btn btn-primary btn-sm sub"
              onClick={() => setEditing({ event_date: pick })}
            >+ 일정 추가</button>
          </h2>
          {dayItems.length === 0 ? (
            <div className="empty tiny">이 날은 비어 있어요</div>
          ) : (
            <ul className="mini-list">
              {dayItems.map((it, i) =>
                it.kind === 'event' ? (
                  <li key={'e' + it.row.id}>
                    <span className="badge" style={{ background: EVENT_TYPES[it.row.event_type]?.color }}>
                      {EVENT_TYPES[it.row.event_type]?.emoji} {EVENT_TYPES[it.row.event_type]?.label}
                    </span>
                    <span className="ttl">{it.row.title}</span>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditing(it.row)}>✏️</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(it.row)}>×</button>
                  </li>
                ) : (
                  <li key={'t' + it.row.id + i}>
                    <span className="badge">💼 업무 마감</span>
                    <span className="ttl">{it.row.title}</span>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      )}

      {editing && (
        <EventModal
          ev={editing.id ? editing : null}
          date={editing.event_date}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            if (editing.id) await editEvent(editing.id, patch)
            else await addEvent(patch)
            setEditing(null)
          }}
        />
      )}

      {confirm && (
        <Confirm
          message={`「${confirm.title}」 일정을 삭제할까요?`}
          onCancel={() => setConfirm(null)}
          onOk={async () => { await removeEvent(confirm.id); setConfirm(null) }}
        />
      )}
    </>
  )
}

function EventModal({ ev, date, onClose, onSave }) {
  const [f, setF] = useState({
    title: ev?.title ?? '',
    description: ev?.description ?? '',
    event_date: ev?.event_date ?? date,
    event_type: ev?.event_type ?? 'personal',
  })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  return (
    <Modal
      title={ev ? '✏️ 일정 수정' : '＋ 새 일정'}
      onClose={onClose}
      width="420px"
      footer={
        <>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" onClick={() => f.title.trim() && onSave(f)}>저장</button>
        </>
      }
    >
      <div className="field">
        <label>제목 *</label>
        <input className="input" value={f.title} onChange={set('title')} autoFocus />
      </div>
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div className="field">
          <label>날짜</label>
          <input className="input" type="date" value={f.event_date} onChange={set('event_date')} />
        </div>
        <div className="field">
          <label>종류</label>
          <select className="select" value={f.event_type} onChange={set('event_type')}>
            {Object.entries(EVENT_TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v.emoji} {v.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>설명</label>
        <textarea className="textarea" rows={2} value={f.description} onChange={set('description')} />
      </div>
    </Modal>
  )
}
