import { supabase, unwrap } from '../lib/supabase'

/* 캘린더 일정 */

export const EVENT_TYPES = {
  personal: { label: '개인',   emoji: '🌷', color: '#ffd9e6' },
  work:     { label: '업무',   emoji: '💼', color: '#e8f4ff' },
  sample:   { label: '샘플',   emoji: '📦', color: '#fff6c7' },
  ad:       { label: '광고',   emoji: '📣', color: '#ffe9c7' },
  upload:   { label: '업로드', emoji: '🎬', color: '#e6e2ff' },
}

export async function listEvents() {
  return unwrap(await supabase.from('mh_events').select('*').order('event_date'))
}

export async function createEvent(patch) {
  return unwrap(await supabase.from('mh_events').insert(patch).select().single())
}

export async function updateEvent(id, patch) {
  return unwrap(
    await supabase.from('mh_events').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteEvent(id) {
  unwrap(await supabase.from('mh_events').delete().eq('id', id))
}
