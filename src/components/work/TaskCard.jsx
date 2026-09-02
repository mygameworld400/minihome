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
  task, locked, predecessor, person, onToggle, onEdit, onDelete, onToggleDaily, dragProps,
}) {
  const st = STATUS[task.status]
  const pr = PRIORITY[task.priority]
  const due = dueInfo(task.due_date)
  const off = task.is_daily === false

  /* 대기 상태에서는 네모 안을 비워둔다 (동그라미 없음) */
  const mark =
    task.status === 'done' ? '✓'
      : locked ? '🔒'
      : task.status === 'todo' ? ''
      : st.mark

  return (
    <li
      className={
        'task-card pop' +
        (task.status === 'done' ? ' is-done' : '') +
        (locked ? ' is-locked' : '') +
        (off ? ' is-off' : '')
      }
      {...dragProps}
    >
      <button
        className={'chk' + (task.status === 'done' ? ' on' : '')}
        onClick={() => onToggle(task)}
        disabled={locked || off}
        title={locked ? '선행 업무가 끝나야 해요' : off ? '오늘 업무가 아니에요' : '완료 처리'}
      >
        {mark}
      </button>

      <div className="tc-body">
        <div className="tc-title">{task.title}</div>

        <div className="row-wrap tc-meta">

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
        {/* ON = 매일 하는 업무 (날짜 바뀌면 대기로 돌아옴) / OFF = 오늘은 업무 아님 */}
        <button
          className={'daily-sw' + (off ? '' : ' on')}
          onClick={() => onToggleDaily(task)}
          title={off ? 'OFF — 업무 아닌 상태' : 'ON — 매일 하는 업무'}
          aria-pressed={!off}
        >
          <i />
          <em>{off ? 'OFF' : 'ON'}</em>
        </button>
        <div className="row" style={{ gap: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => onEdit(task)} title="수정">✏️</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onDelete(task)} title="삭제">🗑️</button>
        </div>
      </div>
    </li>
  )
}
