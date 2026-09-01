import { NavLink } from 'react-router-dom'
import { useStore } from '../../hooks/useStore'
import { useAuth } from '../../hooks/useAuth'
import './sidebar.css'

export const MENU = [
  { to: '/',         emoji: '🏠', label: 'HOME',     desc: '미니홈피' },
  { to: '/work',     emoji: '💼', label: 'WORK',     desc: '업무보드' },
  { to: '/my',       emoji: '🌷', label: 'MY',       desc: '개인보드' },
  { to: '/hobby',    emoji: '🎨', label: 'HOBBY',    desc: '취미보드' },
  { to: '/money',    emoji: '💰', label: 'MONEY',    desc: '가계부' },
  { to: '/calendar', emoji: '📅', label: 'CALENDAR', desc: '일정' },
  { to: '/memo',     emoji: '📝', label: 'MEMO',     desc: '메모' },
  { to: '/stats',    emoji: '📊', label: 'STATS',    desc: '통계' },
  { to: '/settings', emoji: '⚙️', label: 'SETTINGS', desc: '설정' },
]

export default function Sidebar() {
  const { profile, tasks } = useStore()
  const { signOut } = useAuth()

  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length

  return (
    <aside className="sidebar">
      <div className="card mini-profile">
        <div className="avatar floaty">{profile?.avatar_emoji ?? '🐰'}</div>
        <div className="nick">{profile?.nickname ?? '...'}</div>
        <div className="bio">{profile?.bio}</div>
        <div className="row-wrap" style={{ justifyContent: 'center', marginTop: 8 }}>
          <span className="badge">{profile?.mood ?? '😊'}</span>
          <span className="badge">{profile?.status ?? '작업중'}</span>
        </div>
      </div>

      <nav className="menu card">
        {MENU.map((m) => (
          <NavLink
            key={m.to}
            to={m.to}
            end={m.to === '/'}
            className={({ isActive }) => 'menu-item' + (isActive ? ' on' : '')}
          >
            <span className="ico wiggle-hover">{m.emoji}</span>
            <span className="lbl">{m.label}</span>
            <span className="dsc">{m.desc}</span>
          </NavLink>
        ))}
      </nav>

      <div className="card counter">
        <div className="tiny muted">전체 업무</div>
        <div className="row" style={{ gap: 6 }}>
          <strong style={{ fontSize: 22 }}>{done}</strong>
          <span className="muted">/ {total}</span>
        </div>
        <div className="bar" style={{ marginTop: 6 }}>
          <i style={{ width: total ? `${(done / total) * 100}%` : '0%' }} />
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%' }} onClick={signOut}>
          로그아웃
        </button>
      </div>

      <p className="sig tiny muted">made with ☁️ + 🍓</p>
    </aside>
  )
}

/** 모바일 하단 네비게이션 */
export function MobileNav() {
  return (
    <nav className="mobile-nav">
      {MENU.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          end={m.to === '/'}
          className={({ isActive }) => 'mnav-item' + (isActive ? ' on' : '')}
        >
          <span>{m.emoji}</span>
          <em>{m.label}</em>
        </NavLink>
      ))}
    </nav>
  )
}
