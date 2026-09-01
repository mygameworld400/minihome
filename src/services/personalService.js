import { supabase, unwrap } from '../lib/supabase'

/* 개인보드 — 카테고리 + 개인 할일 */

export async function listCategories() {
  return unwrap(
    await supabase
      .from('mh_personal_categories')
      .select('*')
      .order('sort_order')
      .order('id'),
  )
}

export async function createCategory(patch) {
  return unwrap(
    await supabase.from('mh_personal_categories').insert(patch).select().single(),
  )
}

export async function updateCategory(id, patch) {
  return unwrap(
    await supabase
      .from('mh_personal_categories')
      .update(patch)
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function deleteCategory(id) {
  unwrap(await supabase.from('mh_personal_categories').delete().eq('id', id))
}

export async function listPersonalTasks() {
  return unwrap(
    await supabase
      .from('mh_personal_tasks')
      .select('*')
      .order('sort_order')
      .order('id'),
  )
}

export async function createPersonalTask(patch) {
  return unwrap(
    await supabase.from('mh_personal_tasks').insert(patch).select().single(),
  )
}

export async function updatePersonalTask(id, patch) {
  return unwrap(
    await supabase
      .from('mh_personal_tasks')
      .update(patch)
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function deletePersonalTask(id) {
  unwrap(await supabase.from('mh_personal_tasks').delete().eq('id', id))
}
