import { useMemo, useRef, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { STATUS, isLocked } from '../services/taskService'
import TaskCard from '../components/work/TaskCard'
import TaskModal from '../components/work/TaskModal'
import { Confirm } from '../components/common/Modal'
import './work.css'

export default function Work() {
  const {
    tracks, people, tasks, byId,
    addTask, toggleTask, removeTask, moveTask,
  } = useStore()

  const [q, setQ] = useState('')
  const [fTrack, setFTrack] = useState('')
  const [fPerson, setFPerson] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [hideDone, setHideDone] = useState(false)

  const [editing, setEditing] = useState(null)   // task | 'new'
  const [newIn, setNewIn] = useState(null)       // 빠른 추가 중인 트랙 id
  const [confirm, setConfirm] = useState(null)

  const dragId = useRef(null)

  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people])

  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return tasks.filter((t) => {
      if (kw && !t.title.toLowerCase().includes(kw)) return false
      if (fTrack && String(t.track_id) !== fTrack) return false
      if (fPerson && String(t.assignee_id) !== fPerson) return false
      if (fStatus && t.status !== fStatus) return false
      if (hideDone && t.status === 'done') return false
      return true
    })
  }, [tasks, q, fTrack, fPerson, fStatus, hideDone])

  /* 트랙별로 묶는다. 트랙 없는 업무는 마지막 '기타' 그룹으로. */
  const groups = useMemo(() => {
    const g = tracks.map((tr) => ({
      track: tr,
      items: filtered.filter((t) => t.track_id === tr.id)
        .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
    }))
    const orphan = filtered.filter((t) => !t.track_id)
    if (orphan.length) g.push({ track: null, items: orphan })
    return g
  }, [tracks, filtered])

  const shownCount = filtered.length
  const doneCount = filtered.filter((t) => t.status === 'done').length

  async function quickAdd(e, trackId) {
    e.preventDefault()
    const input = e.target.elements.title
    const title = input.value.trim()
    if (!title) return
    const siblings = tasks.filter((t) => t.track_id === trackId)
    const next = siblings.length ? Math.max(...siblings.map((t) => t.sort_order)) + 1 : 1
    await addTask({ title, track_id: trackId, sort_order: next })
    input.value = ''
    input.focus()
  }

  /* ── 드래그 정렬 (같은 트랙 안에서만) ───────────────────── */
  function onDrop(group, targetId) {
    const from = dragId.current
    dragId.current = null
    if (!from || from === targetId) return
    const ids = group.items.map((t) => t.id)
    if (!ids.includes(from) || !ids.includes(targetId)) return
    const arr = [...group.items]
    const fi = arr.findIndex((t) => t.id === from)
    const ti = arr.findIndex((t) => t.id === targetId)
    const [moved] = arr.splice(fi, 1)
    arr.splice(ti, 0, moved)
    moveTask(arr)
  }

  return (
    <>
      <div className="page-head">
        <h1>💼 업무보드</h1>
        <span className="spacer tiny muted">{doneCount} / {shownCount} 완료</span>
        <button className="btn btn-primary btn-sm" onClick={() => setEditing('new')}>+ 새 업무</button>
      </div>

      {/* ── 검색 / 필터 ───────────────────────────────────── */}
      <section className="card filters">
        <input
          className="input" placeholder="🔍 업무명 검색…"
          value={q} onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={fTrack} onChange={(e) => setFTrack(e.target.value)}>
          <option value="">전체 트랙</option>
          {tracks.map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
        </select>
        <select className="select" value={fPerson} onChange={(e) => setFPerson(e.target.value)}>
          <option value="">전체 담당자</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>)}
        </select>
        <select className="select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">전체 상태</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v.mark} {v.label}</option>
          ))}
        </select>
        <label className="chk-inline">
          <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} />
          완료 숨기기
        </label>
        {(q || fTrack || fPerson || fStatus || hideDone) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setQ(''); setFTrack(''); setFPerson(''); setFStatus(''); setHideDone(false) }}
          >초기화</button>
        )}
      </section>

      {/* ── 트랙별 보드 ───────────────────────────────────── */}
      <div className="board">
        {groups.map((g) => {
          const tr = g.track
          const key = tr?.id ?? 'none'
          const dn = g.items.filter((t) => t.status === 'done').length
          return (
            <section
              className="card track"
              key={key}
              style={tr ? { borderColor: tr.color } : undefined}
            >
              <h2 className="card-title track-head" style={tr ? { background: tr.color } : undefined}>
                <span>{tr?.emoji ?? '📂'}</span>
                <span>{tr?.name ?? '트랙 없음'}</span>
                <span className="sub">{dn}/{g.items.length}</span>
              </h2>

              {tr?.description && <p className="tiny muted track-desc">{tr.description}</p>}

              {g.items.length === 0 ? (
                <div className="empty tiny">비어 있어요</div>
              ) : (
                <ul className="task-list">
                  {g.items.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      locked={isLocked(t, byId)}
                      predecessor={t.predecessor_id ? byId.get(t.predecessor_id) : null}
                      person={t.assignee_id ? personById.get(t.assignee_id) : null}
                      onToggle={toggleTask}
                      onEdit={setEditing}
                      onDelete={(task) => setConfirm(task)}
                      dragProps={{
                        draggable: true,
                        onDragStart: () => { dragId.current = t.id },
                        onDragOver: (e) => e.preventDefault(),
                        onDrop: () => onDrop(g, t.id),
                      }}
                    />
                  ))}
                </ul>
              )}

              {tr && (
                newIn === tr.id ? (
                  <form className="quick" onSubmit={(e) => quickAdd(e, tr.id)}>
                    <input
                      className="input" name="title" autoFocus
                      placeholder="업무명 입력 후 엔터…"
                      onBlur={(e) => { if (!e.target.value.trim()) setNewIn(null) }}
                    />
                  </form>
                ) : (
                  <button className="btn btn-ghost btn-sm add-btn" onClick={() => setNewIn(tr.id)}>
                    + 업무 추가
                  </button>
                )
              )}
            </section>
          )
        })}
      </div>

      {editing && (
        <TaskModal
          task={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {confirm && (
        <Confirm
          message={`「${confirm.title}」 업무를 삭제할까요?`}
          detail="되돌릴 수 없어요."
          onCancel={() => setConfirm(null)}
          onOk={async () => { await removeTask(confirm.id); setConfirm(null) }}
        />
      )}
    </>
  )
}
