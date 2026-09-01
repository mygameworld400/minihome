import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { hasServer } from '../lib/supabase'

export default function Login() {
  const { enter } = useAuth()
  const [code, setCode] = useState('')
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(false)

  async function submit(e) {
    e.preventDefault()
    const c = code.trim()
    if (!c) return

    setBusy(true); setErr(null)
    const { error } = await enter(c)
    setBusy(false)

    if (error) {
      setErr('입장코드가 달라요 🥺')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setCode('')
    }
  }

  if (!hasServer) {
    return (
      <div className="login-wrap">
        <div className="card login-card">
          <div className="login-logo">☁️</div>
          <h1>MINI HOME</h1>
          <p className="muted tiny">
            Supabase 환경변수가 없습니다.<br />
            <code>.env.local</code> 에 <code>VITE_SUPABASE_URL</code> 과{' '}
            <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> 를 넣어주세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-wrap">
      <form className={'card login-card' + (shake ? ' shake' : '')} onSubmit={submit}>
        <div className="login-logo floaty">🏠</div>
        <h1>MINI HOME</h1>
        <p className="muted tiny" style={{ marginTop: -6 }}>
          입장코드를 입력해 주세요
        </p>

        <input
          className="input code-input"
          type="password"
          value={code}
          onChange={(e) => { setCode(e.target.value); setErr(null) }}
          placeholder="· · · · · · · ·"
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />

        <p className="tiny" style={{ minHeight: 20, color: 'var(--dang)', margin: '6px 0 0' }}>
          {err}
        </p>

        <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy || !code.trim()}>
          {busy ? '확인 중…' : '들어가기'}
        </button>

        <p className="tiny muted" style={{ marginBottom: 0 }}>
          오늘도 하나씩 해내는 중 ☁️
        </p>
      </form>
    </div>
  )
}
