import { supabase, unwrap } from '../lib/supabase'

/* ===========================================================
   업무 / 트랙 / 담당자 — DB 접근은 전부 여기로 모은다.
   컴포넌트는 이 파일의 함수만 부른다.
   =========================================================== */

export const STATUS = {
  todo:  { label: '대기',   mark: '○', color: '#9aa4b2' },
  doing: { label: '진행중', mark: '◐', color: '#5b9bd5' },
  done:  { label: '완료',   mark: '✓', color: '#5fb98e' },
  hold:  { label: '보류',   mark: '⏳', color: '#d4a15a' },
}

export const PRIORITY = {
  low:    { label: '낮음', mark: '·',  color: '#b8c0cc' },
  normal: { label: '보통', mark: '–',  color: '#7d8794' },
  high:   { label: '높음', mark: '!',  color: '#e8798b' },
}

/* ── 트랙 ────────────────────────────────────────────────── */
export async function listTracks() {
  return unwrap(
    await supabase.from('mh_tracks').select('*').order('sort_order').order('id'),
  )
}

export async function createTrack(patch) {
  return unwrap(
    await supabase.from('mh_tracks').insert(patch).select().single(),
  )
}

export async function updateTrack(id, patch) {
  return unwrap(
    await supabase.from('mh_tracks').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteTrack(id) {
  unwrap(await supabase.from('mh_tracks').delete().eq('id', id))
}

/* ── 담당자 ──────────────────────────────────────────────── */
export async function listPeople() {
  return unwrap(
    await supabase.from('mh_people').select('*').order('sort_order').order('id'),
  )
}

export async function createPerson(patch) {
  return unwrap(await supabase.from('mh_people').insert(patch).select().single())
}

export async function updatePerson(id, patch) {
  return unwrap(
    await supabase.from('mh_people').update(patch).eq('id', id).select().single(),
  )
}

export async function deletePerson(id) {
  unwrap(await supabase.from('mh_people').delete().eq('id', id))
}

/* ── 업무 ────────────────────────────────────────────────── */
export async function listTasks() {
  return unwrap(
    await supabase.from('mh_tasks').select('*').order('sort_order').order('id'),
  )
}

/** 빠른 추가 — 제목만 받고 나머지는 기본값. */
export async function createTask(patch) {
  return unwrap(await supabase.from('mh_tasks').insert(patch).select().single())
}

export async function updateTask(id, patch) {
  return unwrap(
    await supabase.from('mh_tasks').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteTask(id) {
  unwrap(await supabase.from('mh_tasks').delete().eq('id', id))
}

/** 드래그로 바뀐 순서를 한 번에 저장한다. */
export async function reorderTasks(rows) {
  await Promise.all(
    rows.map((r) =>
      supabase.from('mh_tasks').update({ sort_order: r.sort_order }).eq('id', r.id),
    ),
  )
}

/* ===========================================================
   매일 반복 업무

   업무 목록 자체가 곧 기본값이다. 별도 템플릿을 두지 않으므로
   추가·수정·삭제가 그대로 다음날 목록에 반영된다.
   날짜가 바뀌면 ON 인 업무만 대기 상태로 되돌린다.
   =========================================================== */

/** 오늘 아직 리셋 안 했으면 리셋한다. 되돌린 업무 수를 반환. */
export async function runDailyReset() {
  const { data, error } = await supabase.rpc('mh_daily_reset')
  if (error) throw error
  return data ?? 0
}

/** 로컬 기준 오늘 날짜 (YYYY-MM-DD) */
export function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ── 완료 이력 ───────────────────────────────────────────── */
/* status 는 매일 초기화되므로 통계는 이 로그에서 읽는다. */

export async function listDoneLog(days = 60) {
  const from = new Date()
  from.setDate(from.getDate() - days)
  const iso = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`
  return unwrap(
    await supabase
      .from('mh_task_done_log')
      .select('*')
      .gte('done_date', iso)
      .order('done_date', { ascending: false }),
  )
}

export async function logDone(task) {
  return unwrap(
    await supabase
      .from('mh_task_done_log')
      .upsert(
        {
          task_id: task.id,
          done_date: todayISO(),
          title: task.title,
          track_id: task.track_id,
        },
        { onConflict: 'owner,task_id,done_date' },
      )
      .select()
      .single(),
  )
}

export async function unlogDone(taskId) {
  unwrap(
    await supabase
      .from('mh_task_done_log')
      .delete()
      .eq('task_id', taskId)
      .eq('done_date', todayISO()),
  )
}

/* ===========================================================
   선행 업무 — 잠금 판정은 클라이언트에서 계산한다.
   predecessor 가 있고 그게 done 이 아니면 잠긴 것으로 본다.
   =========================================================== */
export function isLocked(task, byId) {
  if (!task.predecessor_id) return false
  const pre = byId.get(task.predecessor_id)
  if (!pre) return false
  return pre.status !== 'done'
}

/** 순환 참조를 막는다 — a 의 선행으로 b 를 지정해도 되는지. */
export function canBePredecessor(taskId, candidateId, byId) {
  if (taskId === candidateId) return false
  let cur = byId.get(candidateId)
  const seen = new Set()
  while (cur?.predecessor_id) {
    if (cur.predecessor_id === taskId) return false
    if (seen.has(cur.predecessor_id)) break
    seen.add(cur.predecessor_id)
    cur = byId.get(cur.predecessor_id)
  }
  return true
}
