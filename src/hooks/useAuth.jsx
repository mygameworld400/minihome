import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, hasServer } from '../lib/supabase'

/* ===========================================================
   입장코드 방식 로그인.

   화면에는 코드 입력칸 하나만 보이지만, 내부적으로는 고정 계정의
   비밀번호로 Supabase 로그인을 한다.

   왜 이렇게 하나?
     코드를 프론트에서 `code === '...'` 로 비교하면 번들에 코드가
     그대로 들어간다. 그러면 F12 로 코드를 보고, publishable 키까지
     같이 얻어서 REST API 로 DB 를 통째로 읽어갈 수 있다.
     비밀번호로 두면 검증이 Supabase 서버에서 일어나므로 번들에는
     코드가 남지 않고, RLS 도 그대로 auth.uid() 기준으로 작동한다.
   =========================================================== */

export const ACCOUNT_EMAIL = 'minihome@minihome.local'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hasServer) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  /** 입장코드로 들어간다. 맞으면 세션이 생기고, 틀리면 에러를 돌려준다. */
  async function enter(code) {
    const { error } = await supabase.auth.signInWithPassword({
      email: ACCOUNT_EMAIL,
      password: code,
    })
    return { error }
  }

  const value = {
    session,
    user: session?.user ?? null,
    loading,
    enter,
    signOut: () => supabase.auth.signOut(),
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>')
  return v
}
