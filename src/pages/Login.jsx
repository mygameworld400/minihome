import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { hasServer } from '../lib/supabase'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('in')     // in | up
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const fn = mode === 'in' ? signIn : signUp
    const { error } = await fn(email.trim(), pw)
    setBusy(false)
    if (error) { setMsg({ bad: true, text: error.message }); return }
    if (mode === 'up') {
      setMsg({ text: '가입 완료! 메일함에서 인증한 뒤 로그인해 주세요 💌' })
      setMode('in')
    }
  }

  if (!hasServer) {
    return (
      <div className="login-wrap">
        <div className="card login-card">
          <div className="login-logo">☁️</div>
          <h1>MINI HOME</h1>
          <p className="muted">
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
      <form className="card login-card" onSubmit={submit}>
        <div className="login-logo floaty">☁️</div>
        <h1>MINI HOME</h1>
        <p className="muted tiny" style={{ marginTop: -6 }}>오늘도 하나씩 해내는 중</p>

        <div className="field" style={{ textAlign: 'left', marginTop: 18 }}>
          <label>이메일</label>
          <input
            className="input" type="email" required autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="field" style={{ textAlign: 'left' }}>
          <label>비밀번호</label>
          <input
            className="input" type="password" required minLength={6}
            autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
            value={pw} onChange={(e) => setPw(e.target.value)}
            placeholder="6자 이상"
          />
        </div>

        {msg && (
          <p className="tiny" style={{ color: msg.bad ? 'var(--dang)' : 'var(--ok)' }}>
            {msg.text}
          </p>
        )}

        <button className="btn btn-primary" style={{ width: '100%', marginTop: 4 }} disabled={busy}>
          {busy ? '잠시만요…' : mode === 'in' ? '들어가기' : '가입하기'}
        </button>

        <button
          type="button"
          className="btn btn-ghost btn-sm"
          style={{ marginTop: 8 }}
          onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(null) }}
        >
          {mode === 'in' ? '처음이신가요? 가입하기' : '이미 계정이 있어요'}
        </button>
      </form>
    </div>
  )
}
