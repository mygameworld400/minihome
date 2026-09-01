import { STATUS, PRIORITY } from '../../services/taskService'

const DAY = 86400000

function dueInfo(due) {
  if (!due) return null
  const d = new Date(due + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / DAY)
  const label = `${d.getMonth() + 1}/${d.getDate()}`
  if (diff < 0)  return { label: `${label} (${-diff}일 지남)`, tone: 'over' }
  if (diff === 0) return { label: `${label} (오늘!)`, tone: 'today' }
  if (diff <= 3)  return { label: `${label} (D-${diff})`, tone: 'soon' }
  return { label, tone: '' }
}

export default function TaskCard({
  task, locked, predecessor, person, onToggle, onEdit, onDelete, dragProps,
}) {
  const st = STATUS[task.status]
  const pr = PRIORITY[task.priority]
  const due = dueInfo(task.due_date)

  return (
    <li
      className={
        'task-card pop' +
        (task.status === 'done' ? ' is-done' : '') +
        (locked ? ' is-locked' : '')
      }
      {...dragProps}
    >
      <button
        className={'chk' + (task.status === 'done' ? ' on' : '')}
        onClick={() => onToggle(task)}
        disabled={locked}
        title={locked ? '선행 업무가 끝나야 해요' : '완료 처리'}
      >
        {task.status === 'done' ? '✓' : locked ? '🔒' : st.mark}
      </button>

      <div className="tc-body">
        <div className="tc-title">{task.title}</div>

        <div className="row-wrap tc-meta">
          <span className="badge" style={{ borderColor: st.color, color: st.color }}>
            {st.mark} {st.label}
          </span>

          {task.priority !== 'normal' && (
            <span className="badge" style={{ borderColor: pr.color, color: pr.color }}>
              {task.priority === 'high' ? '❗' : '·'} {pr.label}
            </span>
          )}

          {person && (
            <span className="badge" style={{ background: person.color }}>
              {person.emoji} {person.name}
            </span>
          )}

          {due && <span className={'badge due ' + due.tone}>📅 {due.label}</span>}

          {locked && (
            <span className="badge lock">🔒 선행: {predecessor?.title ?? '?'}</span>
          )}
        </div>

        {task.memo && <p className="tc-memo">🗒 {task.memo}</p>}
      </div>

      <div className="tc-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)} title="수정">✏️</button>
        <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task)} title="삭제">🗑️</button>
      </div>
    </li>
  )
}
