import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../hooks/useStore'
import { STATUS, isLocked } from '../services/taskService'
import './home.css'

const MOODS = ['😊', '🥰', '😌', '🔥', '😴', '🥲', '😵‍💫', '🤍']

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

export default function Home() {
  const {
    profile, saveProfile, tasks, byId, tracks,
    diary, addDiary, removeDiary, toggleTask, doneLog,
  } = useStore()

  const [note, setNote] = useState('')
  const [mood, setMood] = useState(profile?.mood ?? '😊')
  const [goal, setGoal] = useState(profile?.today_goal ?? '')
  const [editGoal, setEditGoal] = useState(false)

  const trackById = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks])

  const done = tasks.filter((t) => t.status === 'done')
  const open = tasks.filter((t) => t.status !== 'done' && !isLocked(t, byId))
  const todayList = open.slice(0, 5)

  const total = tasks.length
  const pct = total ? Math.round((done.length / total) * 100) : 0
  const filled = Math.round(pct / 10)

  /* status 는 매일 초기화되므로 최근 완료는 로그에서 읽는다 */
  const recent = doneLog.slice(0, 6)

  async function postDiary(e) {
    e.preventDefault()
    const body = note.trim()
    if (!body) return
    await addDiary({ body, mood })
    setNote('')
  }

  return (
    <>
      <div className="page-head">
        <h1>🏠 나의 미니홈피</h1>
        <span className="spacer tiny muted">{todayStr()}</span>
      </div>

      {/* ── 프로필 배너 ─────────────────────────────────── */}
      <section className="card home-banner">
        <div className="hb-avatar floaty">{profile?.avatar_emoji ?? '🐰'}</div>
        <div className="hb-text">
          <div className="hb-nick">{profile?.nickname}</div>
          <div className="hb-bio">"{profile?.bio}"</div>
          <div className="row-wrap" style={{ marginTop: 8 }}>
            <span className="badge">{profile?.mood} 기분</span>
            <span className="badge">📍 {profile?.status}</span>
          </div>
        </div>
        <div className="hb-goal">
          <div className="tiny muted">오늘의 목표</div>
          {editGoal ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                await saveProfile({ today_goal: goal })
                setEditGoal(false)
              }}
            >
              <input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} autoFocus />
              <button className="btn btn-sm btn-primary" style={{ marginTop: 6 }}>저장</button>
            </form>
          ) : (
            <button
              className="hb-goal-text"
              onClick={() => { setGoal(profile?.today_goal ?? ''); setEditGoal(true) }}
            >
              {profile?.today_goal || '눌러서 목표 적기 ✏️'}
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {/* ── 오늘의 업무 ───────────────────────────────── */}
        <section className="card">
          <h2 className="card-title">
            📌 오늘의 업무
            <Link to="/work" className="sub">전체 보기 →</Link>
          </h2>
          {todayList.length === 0 ? (
            <div className="empty">할 일이 없어요! 오늘은 쉬어가도 좋아요 ☁️</div>
          ) : (
            <ul className="mini-list">
              {todayList.map((t) => (
                <li key={t.id}>
                  <button
                    className={'chk' + (t.status === 'done' ? ' on' : '')}
                    onClick={() => toggleTask(t)}
                    title="완료 처리"
                  >
                    {t.status === 'done' ? '✓' : t.status === 'todo' ? '' : STATUS[t.status].mark}
                  </button>
                  <span className="ttl">{t.title}</span>
                  {t.track_id && (
                    <span className="badge tiny">
                      {trackById.get(t.track_id)?.emoji} {trackById.get(t.track_id)?.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── 오늘의 기록 ───────────────────────────────── */}
        <section className="card">
          <h2 className="card-title">📈 나의 기록</h2>
          <div className="record-num">
            <strong>{done.length}</strong>
            <span className="muted"> / {total}</span>
          </div>
          <div className="dots" style={{ margin: '4px 0 10px' }}>
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className={i < filled ? 'on' : 'off'}>█</span>
            ))}
            <span className="muted tiny"> {pct}%</span>
          </div>
          <div className="grid grid-3" style={{ gap: 8 }}>
            <div className="stat-chip"><b>{open.length}</b><span>남은 일</span></div>
            <div className="stat-chip"><b>{tasks.filter((t) => t.status === 'doing').length}</b><span>진행중</span></div>
            <div className="stat-chip"><b>{tasks.filter((t) => isLocked(t, byId)).length}</b><span>잠김</span></div>
          </div>
        </section>
      </div>

      <div className="grid grid-2" style={{ marginTop: 14 }}>
        {/* ── 미니 다이어리 ─────────────────────────────── */}
        <section className="card">
          <h2 className="card-title">📔 미니 다이어리</h2>
          <form onSubmit={postDiary}>
            <div className="row-wrap" style={{ marginBottom: 6 }}>
              {MOODS.map((m) => (
                <button
                  type="button" key={m}
                  className={'mood' + (mood === m ? ' on' : '')}
                  onClick={() => setMood(m)}
                >{m}</button>
              ))}
            </div>
            <textarea
              className="textarea" rows={3}
              placeholder="오늘 어땠나요? 짧게 남겨보세요…"
              value={note} onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}>기록하기</button>
          </form>

          <ul className="diary-list">
            {diary.slice(0, 4).map((d) => (
              <li key={d.id}>
                <span className="dm">{d.mood}</span>
                <div>
                  <p>{d.body}</p>
                  <span className="tiny muted">{d.entry_date}</span>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => removeDiary(d.id)}>×</button>
              </li>
            ))}
          </ul>
        </section>

        {/* ── 최근 완료 ─────────────────────────────────── */}
        <section className="card">
          <h2 className="card-title">🎉 최근 완료한 일</h2>
          {recent.length === 0 ? (
            <div className="empty">아직 완료한 업무가 없어요</div>
          ) : (
            <ul className="mini-list done-list">
              {recent.map((r, i) => (
                <li key={`${r.task_id}-${r.done_date}-${i}`}>
                  <span className="chk on">✓</span>
                  <span className="ttl">{r.title}</span>
                  <span className="tiny muted">
                    {r.done_date.slice(5).replace('-', '/')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
