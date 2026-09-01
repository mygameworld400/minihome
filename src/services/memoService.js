import { supabase, unwrap } from '../lib/supabase'

/* 메모 + 미니 다이어리 */

export async function listMemos() {
  return unwrap(
    await supabase.from('mh_memos').select('*').order('created_at', { ascending: false }),
  )
}

export async function createMemo(patch) {
  return unwrap(await supabase.from('mh_memos').insert(patch).select().single())
}

export async function updateMemo(id, patch) {
  return unwrap(
    await supabase.from('mh_memos').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteMemo(id) {
  unwrap(await supabase.from('mh_memos').delete().eq('id', id))
}

/* ── 다이어리 ────────────────────────────────────────────── */
export async function listDiary(limit = 10) {
  return unwrap(
    await supabase
      .from('mh_diary')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit),
  )
}

export async function createDiary(patch) {
  return unwrap(await supabase.from('mh_diary').insert(patch).select().single())
}

export async function deleteDiary(id) {
  unwrap(await supabase.from('mh_diary').delete().eq('id', id))
}
