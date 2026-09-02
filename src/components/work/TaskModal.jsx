import { useState } from 'react'
import Modal from '../common/Modal'
import { STATUS, PRIORITY, canBePredecessor } from '../../services/taskService'
import { useStore } from '../../hooks/useStore'

/** 업무 상세 추가/수정 모달. task 가 없으면 새로 만드는 모드. */
export default function TaskModal({ task, defaultTrackId, onClose }) {
  const { tracks, people, tasks, byId, addTask, editTask } = useStore()
  const isNew = !task

  const [f, setF] = useState({
    title: task?.title ?? '',
    track_id: task?.track_id ?? defaultTrackId ?? '',
    assignee_id: task?.assignee_id ?? '',
    status: task?.status ?? 'todo',
    priority: task?.priority ?? 'normal',
    due_date: task?.due_date ?? '',
    predecessor_id: task?.predecessor_id ?? '',
    description: task?.description ?? '',
    memo: task?.memo ?? '',
    is_daily: task?.is_daily ?? true,
  })
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  /* 순환 참조가 생기는 후보는 목록에서 뺀다 */
  const preOptions = tasks.filter(
    (t) => !task || canBePredecessor(task.id, t.id, byId),
  )

  async function submit(e) {
    e.preventDefault()
    if (!f.title.trim()) return
    setBusy(true)
    const patch = {
      title: f.title.trim(),
      track_id: f.track_id || null,
      assignee_id: f.assignee_id || null,
      status: f.status,
      priority: f.priority,
      due_date: f.due_date || null,
      predecessor_id: f.predecessor_id || null,
      description: f.description,
      memo: f.memo,
      is_daily: f.is_daily,
    }
    try {
      if (isNew) await addTask(patch)
      else await editTask(task.id, patch)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isNew ? '✏️ 새 업무' : '✏️ 업무 수정'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>취소</button>
          <button type="submit" form="task-form" className="btn btn-primary" disabled={busy}>
            {busy ? '저장 중…' : '저장'}
          </button>
        </>
      }
    >
      <form id="task-form" onSubmit={submit}>
        <div className="field">
          <label>업무명 *</label>
          <input className="input" value={f.title} onChange={set('title')} required autoFocus />
        </div>

        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>트랙</label>
            <select className="select" value={f.track_id} onChange={set('track_id')}>
              <option value="">— 없음 —</option>
              {tracks.map((t) => (
                <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>담당자</label>
            <select className="select" value={f.assignee_id} onChange={set('assignee_id')}>
              <option value="">— 미지정 —</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>{p.emoji} {p.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>상태</label>
            <select className="select" value={f.status} onChange={set('status')}>
              {Object.entries(STATUS).map(([k, v]) => (
                <option key={k} value={k}>{v.mark} {v.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>우선순위</label>
            <select className="select" value={f.priority} onChange={set('priority')}>
              {Object.entries(PRIORITY).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>매일 하는 업무</label>
          <label className="chk-inline" style={{ padding: '4px 0' }}>
            <input
              type="checkbox"
              checked={f.is_daily}
              onChange={(e) => setF((s) => ({ ...s, is_daily: e.target.checked }))}
            />
            ON — 날짜가 바뀌면 다시 대기 상태로 돌아옵니다
          </label>
        </div>

        <div className="field">
          <label>마감일</label>
          <input className="input" type="date" value={f.due_date ?? ''} onChange={set('due_date')} />
        </div>

        <div className="field">
          <label>선행 업무 🔒</label>
          <select className="select" value={f.predecessor_id} onChange={set('predecessor_id')}>
            <option value="">— 없음 —</option>
            {preOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.status === 'done' ? '✓' : '○'} {t.title}
              </option>
            ))}
          </select>
          <p className="tiny muted" style={{ margin: '4px 0 0' }}>
            선행 업무가 완료되기 전까지 이 업무는 잠금 표시됩니다.
          </p>
        </div>

        <div className="field">
          <label>설명</label>
          <textarea className="textarea" rows={2} value={f.description} onChange={set('description')} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>메모</label>
          <textarea className="textarea" rows={2} value={f.memo} onChange={set('memo')} />
        </div>
      </form>
    </Modal>
  )
}
