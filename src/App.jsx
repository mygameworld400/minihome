import { HashRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { StoreProvider } from './hooks/useStore'
import Layout from './components/layout/Layout'
import Login from './pages/Login'
import Home from './pages/Home'
import Work from './pages/Work'
import Personal from './pages/Personal'
import Calendar from './pages/Calendar'
import Memo from './pages/Memo'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

/* GitHub Pages 하위 경로 배포라 HashRouter 를 쓴다.
   404.html 우회 없이 새로고침·직접 진입이 전부 정상 동작한다. */

function Gate() {
  const { user, loading } = useAuth()
  if (loading) return <div className="empty" style={{ paddingTop: 80 }}>☁️ …</div>
  if (!user) return <Login />

  return (
    <StoreProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/work" element={<Work />} />
          <Route path="/my" element={<Personal />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/memo" element={<Memo />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </StoreProvider>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </HashRouter>
  )
}
