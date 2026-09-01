import { Outlet } from 'react-router-dom'
import Sidebar, { MobileNav } from './Sidebar'
import { useStore } from '../../hooks/useStore'

export default function Layout() {
  const { loading, error, setError } = useStore()

  return (
    <>
      <div className="shell">
        <Sidebar />
        <main className="main">
          {error && (
            <div
              className="card"
              style={{ borderColor: '#f3c2cc', background: '#ffe6ea', marginBottom: 12 }}
            >
              <div className="row">
                <span>⚠️ {error}</span>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setError(null)}>
                  닫기
                </button>
              </div>
            </div>
          )}
          {loading ? <div className="empty">불러오는 중… ☁️</div> : <Outlet />}
        </main>
      </div>
      <MobileNav />
    </>
  )
}
