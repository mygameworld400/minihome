import { useMemo } from 'react'
import { useStore } from '../hooks/useStore'
import { STATUS } from '../services/taskService'

const DAY = 86400000

function Bar({ label, emoji, value, max, color, right }) {
  const w = max ? Math.round((value / max) * 100) : 0
  const blocks = Math.max(value ? 1 : 0, Math.round(w / 10))
  return (
    <div className="row" style={{ gap: 8, padding: '5px 0' }}>
      <span style={{ width: 130, flex: 'none', fontSize: 15 }}>
        {emoji} {label}
      </span>
      <span className="dots" style={{ flex: 1, minWidth: 0 }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} style={{ color: i < blocks ? color : 'var(--line-dp)' }}>█</span>
        ))}
      </span>
      <strong style={{ width: 52, textAlign: 'right', fontSize: 15 }}>
        {right ?? value}
      </strong>
    </div>
  )
}

export default function Stats() {
  const { tasks, tracks, people, personalTasks, doneLog } = useStore()

  const s = useMemo(() => {
    const now = new Date()
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)
    const startWeek = new Date(startToday); startWeek.setDate(startToday.getDate() - startToday.getDay())

    /* 업무 status 는 매일 초기화되므로 완료 집계는 로그에서 읽는다 */
    const iso = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const todayIso = iso(startToday)
    const weekIso = iso(startWeek)

    const today = doneLog.filter((r) => r.done_date === todayIso).length
    const week = doneLog.filter((r) => r.done_date >= weekIso).length
    const done = tasks.filter((t) => t.status === 'done')

    const byTrack = tracks.map((tr) => {
      const items = tasks.filter((t) => t.track_id === tr.id)
      return {
        track: tr,
        total: items.length,
        done: items.filter((t) => t.status === 'done').length,
      }
    }).filter((x) => x.total > 0)

    const byPerson = people.map((p) => {
      const items = tasks.filter((t) => t.assignee_id === p.id)
      return {
        person: p,
        total: items.length,
        done: items.filter((t) => t.status === 'done').length,
      }
    }).filter((x) => x.total > 0)

    const byStatus = Object.keys(STATUS).map((k) => ({
      key: k, ...STATUS[k],
      count: tasks.filter((t) => t.status === k).length,
    }))

    /* 최근 7일 완료 추이 */
    const trend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startToday); d.setDate(startToday.getDate() - (6 - i))
      const key = iso(d)
      return {
        label: `${d.getMonth() + 1}/${d.getDate()}`,
        count: doneLog.filter((r) => r.done_date === key).length,
      }
    })

    return {
      total: tasks.length, done: done.length, today, week,
      byTrack, byPerson, byStatus, trend,
      pDone: personalTasks.filter((t) => t.status === 'done').length,
      pTotal: personalTasks.length,
    }
  }, [tasks, tracks, people, personalTasks, doneLog])

  const pct = s.total ? Math.round((s.done / s.total) * 100) : 0
  const maxTrack = Math.max(1, ...s.byTrack.map((x) => x.total))
  const maxPerson = Math.max(1, ...s.byPerson.map((x) => x.total))
  const maxTrend = Math.max(1, ...s.trend.map((x) => x.count))

  return (
    <>
      <div className="page-head"><h1>📊 통계</h1></div>

      <div className="grid grid-3">
        <div className="card" style={{ textAlign: 'center', background: 'var(--pink)', borderColor: 'var(--pink-dp)' }}>
          <div className="tiny">오늘 완료</div>
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{s.today}</div>
          <div className="tiny muted">개</div>
        </div>
        <div className="card" style={{ textAlign: 'center', background: 'var(--sky)', borderColor: 'var(--sky-dp)' }}>
          <div className="tiny">이번 주 완료</div>
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{s.week}</div>
          <div className="tiny muted">개</div>
        </div>
        <div className="card" style={{ textAlign: 'center', background: 'var(--lemon)', borderColor: 'var(--lemon-dp)' }}>
          <div className="tiny">전체 완료율</div>
          <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.2 }}>{pct}%</div>
          <div className="tiny muted">{s.done} / {s.total}</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <section className="card">
          <h2 className="card-title">📁 트랙별 업무량</h2>
          {s.byTrack.length === 0 ? <div className="empty tiny">아직 없어요</div> :
            s.byTrack.map((x) => (
              <Bar
                key={x.track.id}
                emoji={x.track.emoji} label={x.track.name}
                value={x.total} max={maxTrack} color="var(--pink-dp)"
                right={`${x.done}/${x.total}`}
              />
            ))}
        </section>

        <section className="card">
          <h2 className="card-title">🙋 담당자별 업무량</h2>
          {s.byPerson.length === 0 ? <div className="empty tiny">담당자가 지정된 업무가 없어요</div> :
            s.byPerson.map((x) => (
              <Bar
                key={x.person.id}
                emoji={x.person.emoji} label={x.person.name}
                value={x.total} max={maxPerson} color="var(--lav-dp)"
                right={`${x.done}/${x.total}`}
              />
            ))}
        </section>

        <section className="card">
          <h2 className="card-title">🚦 상태 분포</h2>
          <div className="grid grid-2" style={{ gap: 8 }}>
            {s.byStatus.map((x) => (
              <div className="stat-chip" key={x.key} style={{ borderColor: x.color }}>
                <b style={{ color: x.color }}>{x.count}</b>
                <span>{x.mark} {x.label}</span>
              </div>
            ))}
          </div>
          <div className="bar" style={{ marginTop: 12 }}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <p className="tiny muted" style={{ margin: '6px 0 0' }}>
            개인보드는 {s.pDone} / {s.pTotal} 완료
          </p>
        </section>

        <section className="card">
          <h2 className="card-title">📈 최근 7일 완료</h2>
          {s.trend.map((d) => (
            <Bar key={d.label} emoji="·" label={d.label} value={d.count} max={maxTrend} color="var(--mint-dp)" />
          ))}
        </section>
      </div>
    </>
  )
}
