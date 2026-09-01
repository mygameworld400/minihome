import { supabase, unwrap } from '../lib/supabase'

/* 취미보드 — 취미 + 취미별 투두 */

export async function listHobbies() {
  return unwrap(
    await supabase.from('mh_hobbies').select('*').order('sort_order').order('id'),
  )
}

export async function createHobby(patch) {
  return unwrap(await supabase.from('mh_hobbies').insert(patch).select().single())
}

export async function updateHobby(id, patch) {
  return unwrap(
    await supabase.from('mh_hobbies').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteHobby(id) {
  unwrap(await supabase.from('mh_hobbies').delete().eq('id', id))
}

/* ── 취미별 투두 ─────────────────────────────────────────── */
export async function listHobbyTasks() {
  return unwrap(
    await supabase.from('mh_hobby_tasks').select('*').order('sort_order').order('id'),
  )
}

export async function createHobbyTask(patch) {
  return unwrap(
    await supabase.from('mh_hobby_tasks').insert(patch).select().single(),
  )
}

export async function updateHobbyTask(id, patch) {
  return unwrap(
    await supabase.from('mh_hobby_tasks').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteHobbyTask(id) {
  unwrap(await supabase.from('mh_hobby_tasks').delete().eq('id', id))
}
