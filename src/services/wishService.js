import { supabase, unwrap } from '../lib/supabase'

/* 위시리스트 — 카테고리 + 항목 */

export async function listWishCategories() {
  return unwrap(
    await supabase
      .from('mh_wish_categories')
      .select('*')
      .order('sort_order')
      .order('id'),
  )
}

export async function createWishCategory(patch) {
  return unwrap(
    await supabase.from('mh_wish_categories').insert(patch).select().single(),
  )
}

export async function updateWishCategory(id, patch) {
  return unwrap(
    await supabase.from('mh_wish_categories').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteWishCategory(id) {
  unwrap(await supabase.from('mh_wish_categories').delete().eq('id', id))
}

/* ── 항목 ────────────────────────────────────────────────── */
export async function listWishes() {
  return unwrap(
    await supabase.from('mh_wishes').select('*').order('sort_order').order('id'),
  )
}

export async function createWish(patch) {
  return unwrap(await supabase.from('mh_wishes').insert(patch).select().single())
}

export async function updateWish(id, patch) {
  return unwrap(
    await supabase.from('mh_wishes').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteWish(id) {
  unwrap(await supabase.from('mh_wishes').delete().eq('id', id))
}
