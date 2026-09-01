import { supabase, unwrap } from '../lib/supabase'

/* 가계부 — 카테고리 + 수입/지출 내역 */

export const KIND = {
  income:  { label: '수입', sign: '+', color: '#5fb98e' },
  expense: { label: '지출', sign: '−', color: '#e8798b' },
}

/** 1234567 → "1,234,567" */
export const won = (n) => (n ?? 0).toLocaleString('ko-KR')

/* ── 카테고리 ────────────────────────────────────────────── */
export async function listLedgerCategories() {
  return unwrap(
    await supabase
      .from('mh_ledger_categories')
      .select('*')
      .order('kind')
      .order('sort_order')
      .order('id'),
  )
}

export async function createLedgerCategory(patch) {
  return unwrap(
    await supabase.from('mh_ledger_categories').insert(patch).select().single(),
  )
}

export async function updateLedgerCategory(id, patch) {
  return unwrap(
    await supabase
      .from('mh_ledger_categories')
      .update(patch)
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function deleteLedgerCategory(id) {
  unwrap(await supabase.from('mh_ledger_categories').delete().eq('id', id))
}

/* ── 내역 ────────────────────────────────────────────────── */
export async function listLedgerEntries() {
  return unwrap(
    await supabase
      .from('mh_ledger_entries')
      .select('*')
      .order('entry_date', { ascending: false })
      .order('id', { ascending: false }),
  )
}

export async function createLedgerEntry(patch) {
  return unwrap(
    await supabase.from('mh_ledger_entries').insert(patch).select().single(),
  )
}

export async function updateLedgerEntry(id, patch) {
  return unwrap(
    await supabase.from('mh_ledger_entries').update(patch).eq('id', id).select().single(),
  )
}

export async function deleteLedgerEntry(id) {
  unwrap(await supabase.from('mh_ledger_entries').delete().eq('id', id))
}

/* ===========================================================
   집계 — 잔고와 카테고리별 합계는 저장하지 않고 매번 계산한다.
   내역이 바뀌면 화면이 알아서 다시 그려진다.
   =========================================================== */

/** 전체 수입 − 전체 지출 */
export function balanceOf(entries) {
  let income = 0
  let expense = 0
  for (const e of entries) {
    if (e.kind === 'income') income += Number(e.amount)
    else expense += Number(e.amount)
  }
  return { income, expense, balance: income - expense }
}

/** 특정 종류(income/expense)의 카테고리별 합계를 큰 순으로 */
export function byCategory(entries, kind, categories) {
  const catById = new Map(categories.map((c) => [c.id, c]))
  const sums = new Map()
  for (const e of entries) {
    if (e.kind !== kind) continue
    const key = e.category_id ?? 0
    sums.set(key, (sums.get(key) ?? 0) + Number(e.amount))
  }
  const total = [...sums.values()].reduce((a, b) => a + b, 0)
  return {
    total,
    slices: [...sums.entries()]
      .map(([id, value]) => {
        const c = catById.get(id)
        return {
          id,
          name: c?.name ?? '미분류',
          emoji: c?.emoji ?? '❔',
          color: c?.color ?? '#c9c2d4',
          value,
          pct: total ? (value / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.value - a.value),
  }
}
