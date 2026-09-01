import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../hooks/useStore'
import Modal, { Confirm } from '../components/common/Modal'
import './hobby.css'

const ICONS = [
  '🏃', '🎬', '🧶', '📚', '🎮', '🎸', '🍳', '✏️',
  '📷', '🌱', '🧗', '🎨', '🎧', '🏊', '⛰️', '🧩',
]
const COLORS = ['#ffd9e6', '#e8f4ff', '#fff6c7', '#e6e2ff', '#d9f2e6', '#ffe9c7', '#ffe3f1', '#f0e6ff']

export default function Hobby() {
  const {
    hobbies, addHobby, editHobby, removeHobby,
    hobbyTasks, addHobbyTask, editHobbyTask, removeHobbyTask,
  } = useStore()

  const [openId, setOpenId] = useState(null)   // 펼쳐진 취미
  const [modal, setModal] = useState(null)     // 'new' | hobby
  const [confirm, setConfirm] = useState(null)

  const tasksOf = useMemo(() => {
    const m = new Map()
    for (const t of hobbyTasks) {
      if (!m.has(t.hobby_id)) m.set(t.hobby_id, [])
      m.get(t.hobby_id).push(t)
    }
    for (const arr of m.values()) arr.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)
    return m
  }, [hobbyTasks])

  const open = hobbies.find((h) => h.id === openId) ?? null

  return (
    <>
      <div className="page-head">
        <h1>🎨 취미보드</h1>
        <button className="btn btn-primary btn-sm spacer" onClick={() => setModal('new')}>
          + 취미 추가
        </button>
      </div>

      {/* ── 취미 아이콘 격자 ──────────────────────────────── */}
      {hobbies.length === 0 ? (
        <div className="empty">아직 취미가 없어요. 하나 만들어볼까요? 🌱</div>
      ) : (
        <div className="hobby-grid">
          {hobbies.map((h) => {
            const list = tasksOf.get(h.id) ?? []
            const done = list.filter((t) => t.done).length
            return (
              <button
                key={h.id}
                className={'hobby-box' + (openId === h.id ? ' on' : '')}
                style={{ background: h.color }}
                onClick={() => setOpenId(openId === h.id ? null : h.id)}
              >
                <span className="hb-icon">{h.icon}</span>
                <span className="hb-name">{h.name}</span>
                <span className="hb-count">
                  {list.length ? `${done}/${list.length}` : '비어 있음'}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* ── 펼쳐진 취미 상세 ──────────────────────────────── */}
      {open && (
        <HobbyPanel
          key={open.id}
          hobby={open}
          tasks={tasksOf.get(open.id) ?? []}
          onEdit={() => setModal(open)}
          onClose={() => setOpenId(null)}
          onSaveMemo={(memo) => editHobby(open.id, { memo })}
          onAddTask={(title) => {
            const list = tasksOf.get(open.id) ?? []
            const next = list.length ? Math.max(...list.map((t) => t.sort_order)) + 1 : 1
            return addHobbyTask({ hobby_id: open.id, title, sort_order: next })
          }}
          onToggleTask={(t) => editHobbyTask(t.id, { done: !t.done })}
          onRenameTask={(t, title) => editHobbyTask(t.id, { title })}
          onRemoveTask={(t) => setConfirm({ kind: 'task', row: t })}
        />
      )}

      {modal && (
        <HobbyModal
          hobby={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={async (patch) => {
            if (modal === 'new') {
              const r = await addHobby({ ...patch, sort_order: hobbies.length + 1 })
              setOpenId(r.id)
            } else {
              await editHobby(modal.id, patch)
            }
            setModal(null)
          }}
          onDelete={() => { setConfirm({ kind: 'hobby', row: modal }); setModal(null) }}
        />
      )}

      {confirm && (
        <Confirm
          message={
            confirm.kind === 'hobby'
              ? `「${confirm.row.name}」 취미를 삭제할까요?`
              : `「${confirm.row.title}」 삭제할까요?`
          }
          detail={confirm.kind === 'hobby' ? '안에 있는 메모와 할 일도 함께 사라져요.' : undefined}
          onCancel={() => setConfirm(null)}
          onOk={async () => {
            if (confirm.kind === 'hobby') {
              await removeHobby(confirm.row.id)
              if (openId === confirm.row.id) setOpenId(null)
            } else {
              await removeHobbyTask(confirm.row.id)
            }
            setConfirm(null)
          }}
        />
      )}
    </>
  )
}

/* ===========================================================
   상세 패널 — 메모 + 투두리스트
   =========================================================== */
function HobbyPanel({
  hobby, tasks, onEdit, onClose, onSaveMemo,
  onAddTask, onToggleTask, onRenameTask, onRemoveTask,
}) {
  const [memo, setMemo] = useState(hobby.memo ?? '')
  const [saved, setSaved] = useState(false)
  const timer = useRef(null)

  /* 메모는 타이핑이 멎고 0.8초 뒤 자동 저장 */
  useEffect(() => {
    if (memo === (hobby.memo ?? '')) return
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      await onSaveMemo(memo)
      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
    }, 800)
    return () => clearTimeout(timer.current)
  }, [memo])   // eslint-disable-line react-hooks/exhaustive-deps

  const done = tasks.filter((t) => t.done).length
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  function submit(e) {
    e.preventDefault()
    const input = e.target.elements.title
    const v = input.value.trim()
    if (!v) return
    onAddTask(v)
    input.value = ''
    input.focus()
  }

  return (
    <section className="card hobby-panel pop" style={{ borderColor: hobby.color }}>
      <h2 className="card-title hobby-panel-head" style={{ background: hobby.color }}>
        <span style={{ fontSize: 24 }}>{hobby.icon}</span>
        <span>{hobby.name}</span>
        <span className="sub">
          <button className="btn btn-ghost btn-sm" onClick={onEdit}>✏️</button>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </span>
      </h2>

      <div className="grid grid-2" style={{ gap: 16 }}>
        {/* 메모 */}
        <div>
          <div className="row" style={{ marginBottom: 6 }}>
            <strong>📝 메모</strong>
            {saved && <span className="tiny" style={{ color: 'var(--ok)' }}>저장됨 ✓</span>}
          </div>
          <textarea
            className="textarea hobby-memo"
            rows={8}
            placeholder="이 취미에 대해 자유롭게 적어보세요…"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {/* 투두 */}
        <div>
          <div className="row" style={{ marginBottom: 6 }}>
            <strong>✅ 할 일</strong>
            <span className="tiny muted" style={{ marginLeft: 'auto' }}>
              {done}/{tasks.length}
            </span>
          </div>
          {tasks.length > 0 && (
            <div className="bar" style={{ marginBottom: 8 }}>
              <i style={{ width: `${pct}%` }} />
            </div>
          )}

          {tasks.length === 0 ? (
            <div className="empty tiny">할 일이 없어요</div>
          ) : (
            <ul className="mini-list">
              {tasks.map((t) => (
                <li key={t.id}>
                  <button
                    className={'chk' + (t.done ? ' on' : '')}
                    onClick={() => onToggleTask(t)}
                  >{t.done ? '✓' : '○'}</button>
                  <input
                    className="input hobby-task-title"
                    defaultValue={t.title}
                    onBlur={(e) => {
                      const v = e.target.value.trim()
                      if (v && v !== t.title) onRenameTask(t, v)
                      else e.target.value = t.title
                    }}
                    style={t.done ? { color: 'var(--ink-soft)', textDecoration: 'line-through' } : undefined}
                  />
                  <button className="btn btn-ghost btn-sm" onClick={() => onRemoveTask(t)}>×</button>
                </li>
              ))}
            </ul>
          )}

          <form className="quick" onSubmit={submit}>
            <input className="input" name="title" placeholder="+ 할 일 입력 후 엔터…" />
          </form>
        </div>
      </div>
    </section>
  )
}

/* ── 취미 추가/수정 모달 ─────────────────────────────────── */
function HobbyModal({ hobby, onClose, onSave, onDelete }) {
  const [name, setName] = useState(hobby?.name ?? '')
  const [icon, setIcon] = useState(hobby?.icon ?? '🎨')
  const [color, setColor] = useState(hobby?.color ?? COLORS[0])

  return (
    <Modal
      title={hobby ? '✏️ 취미 수정' : '＋ 새 취미'}
      onClose={onClose}
      width="420px"
      footer={
        <>
          {hobby && (
            <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={onDelete}>
              삭제
            </button>
          )}
          <button className="btn" onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            onClick={() => name.trim() && onSave({ name: name.trim(), icon, color })}
          >저장</button>
        </>
      }
    >
      <div className="field">
        <label>취미 이름</label>
        <input
          className="input" value={name} autoFocus
          placeholder="운동 / 영화 / 뜨개질…"
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="field">
        <label>아이콘</label>
        <div className="row-wrap">
          {ICONS.map((i) => (
            <button key={i} className={'mood' + (icon === i ? ' on' : '')} onClick={() => setIcon(i)}>{i}</button>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>색</label>
        <div className="row-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: c,
                border: color === c ? '3px solid var(--ink-soft)' : '2px solid var(--line-dp)',
              }}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
