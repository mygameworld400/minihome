import { supabase, unwrap } from '../lib/supabase'

/* 프로필 — 사용자당 1행. 없으면 만들어서 돌려준다. */

const DEFAULTS = {
  nickname: 'MINJI',
  bio: '오늘도 하나씩 해내는 중 ☁️',
  avatar_emoji: '🐰',
  status: '작업중',
  mood: '😊',
  today_goal: '',
}

export async function getProfile(userId) {
  const rows = unwrap(
    await supabase.from('mh_profiles').select('*').eq('owner', userId).limit(1),
  )
  if (rows.length) return rows[0]

  return unwrap(
    await supabase
      .from('mh_profiles')
      .insert({ owner: userId, ...DEFAULTS })
      .select()
      .single(),
  )
}

export async function updateProfile(userId, patch) {
  return unwrap(
    await supabase
      .from('mh_profiles')
      .update(patch)
      .eq('owner', userId)
      .select()
      .single(),
  )
}
