import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import { KIND, won, balanceOf, byCategory } from '../services/ledgerService'
import Donut from '../components/common/Donut'
import Modal, { Confirm } from '../components/common/Modal'
import './money.css'

const EMOJIS = ['🍚', '🛍️', '🚌', '☕', '🎬', '🏠', '📦', '💊', '🎁', '💰', '✨', '📱']
const COLORS = [
  '#ffb8d1', '#c4b8f0', '#a9d4f5', '#ffcb96', '#9fd9be',
  '#f3a8a8', '#ffe08a', '#c9c2d4', '#8fd4d0', '#e0a8d8',
]

const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Money() {
  const {
    ledgerCategories, ledgerEntries,
    addLedgerEntry, editLedgerEntry, removeLedgerEntry,
    addLedgerCategory, editLedgerCategory, removeLedgerCategory,
  } = useStore()

  const [chartKind, setChartKind] = useState('expense')
  const [filter, setFilter] = useState('all')       // all | income | expense
  const [entryModal, setEntryModal] = useState(null)
  const [catModal, setCatModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const catById = useMemo(
    () => new Map(ledgerCategories.map((c) => [c.id, c])),
    [ledgerCategories],
  )

  /* 잔고와 그래프는 저장하지 않고 내역에서 매번 계산한다 */
  const { income, expense, balance } = useMemo(
    () => balanceOf(ledgerEntries),
    [ledgerEntries],
  )
  const chart = useMemo(
    () => byCategory(ledgerEntries, chartKind, ledgerCategories),
    [ledgerEntries, chartKind, ledgerCategories],
  )

  const list = useMemo(
    () => (filter === 'all' ? ledgerEntries : ledgerEntries.filter((e) => e.kind === filter)),
    [ledgerEntries, filter],
  )

  /* 날짜별로 묶어서 보여준다 */
  const grouped = useMemo(() => {
    const m = new Map()
    for (const e of list) {
      if (!m.has(e.entry_date)) m.set(e.entry_date, [])
      m.get(e.entry_date).push(e)
    }
    return [...m.entries()]
  }, [list])

  return (
    <>
      <div className="page-head">
        <h1>💰 가계부</h1>
        <button className="btn btn-primary btn-sm spacer" onClick={() => setEntryModal('new')}>
          + 내역 추가
        </button>
      </div>

      {/* ── 잔고 + 원형 그래프 ────────────────────────────── */}
      <section className="card money-top">
        <div className="balance">
          <div className="tiny muted">현재 잔고</div>
          <div className={'balance-num' + (balance < 0 ? ' minus' : '')}>
            {won(balance)}<em>원</em>
          </div>
          <div className="row-wrap" style={{ marginTop: 10 }}>
            <span className="badge in">＋ 수입 {won(income)}</span>
            <span className="badge out">− 지출 {won(expense)}</span>
          </div>
        </div>

        <div className="chart-wrap">
          <div className="row" style={{ justifyContent: 'center', gap: 4, marginBottom: 8 }}>
            {['expense', 'income'].map((k) => (
              <button
                key={k}
                className={'btn btn-sm' + (chartKind === k ? ' btn-primary' : '')}
                onClick={() => setChartKind(k)}
              >{KIND[k].label}</button>
            ))}
          </div>

          <div className="chart-row">
            <Donut
              slices={chart.slices}
              center={
                <>
                  <b>{won(chart.total)}</b>
                  <span>{KIND[chartKind].label} 합계</span>
                </>
              }
            />
            <ul className="legend">
              {chart.slices.length === 0 ? (
                <li className="muted tiny">내역이 없어요</li>
              ) : (
                chart.slices.map((s) => (
                  <li key={s.id}>
                    <i style={{ background: s.color }} />
                    <span className="lg-name">{s.emoji} {s.name}</span>
                    <span className="lg-pct tiny muted">{s.pct.toFixed(0)}%</span>
                    <strong className="lg-val">{won(s.value)}</strong>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>

      {/* ── 내역 ──────────────────────────────────────────── */}
      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="card-title">
          🧾 내역
          <span className="sub row" style={{ gap: 4 }}>
            {[
              ['all', '전체'],
              ['income', '수입'],
              ['expense', '지출'],
            ].map(([k, label]) => (
              <button
                key={k}
                className={'btn btn-sm' + (filter === k ? ' btn-primary' : '')}
                onClick={() => setFilter(k)}
              >{label}</button>
            ))}
            <button className="btn btn-sm" onClick={() => setCatModal('list')}>카테고리</button>
          </span>
        </h2>

        {grouped.length === 0 ? (
          <div className="empty">내역이 없어요. 첫 기록을 남겨보세요 💸</div>
        ) : (
          grouped.map(([date, rows]) => {
            const dayTotal = rows.reduce(
              (a, e) => a + (e.kind === 'income' ? Number(e.amount) : -Number(e.amount)),
              0,
            )
            return (
              <div className="day-group" key={date}>
                <div className="day-head">
                  <span>{date}</span>
                  <span className={dayTotal < 0 ? 'minus' : 'plus'}>
                    {dayTotal >= 0 ? '+' : '−'}{won(Math.abs(dayTotal))}
                  </span>
                </div>
                <ul className="entry-list">
                  {rows.map((e) => {
                    const c = e.category_id ? catById.get(e.category_id) : null
                    return (
                      <li key={e.id} className="entry">
                        <span className="e-emoji" style={{ background: c?.color ?? 'var(--line)' }}>
                          {c?.emoji ?? '❔'}
                        </span>
                        <div className="e-body">
                          <div className="e-title">{e.title}</div>
                          <div className="tiny muted">
                            {KIND[e.kind].label}
                            {c ? ` · ${c.name}` : ' · 미분류'}
                            {e.memo ? ` · ${e.memo}` : ''}
                          </div>
                        </div>
                        <strong className={'e-amt ' + e.kind}>
                          {KIND[e.kind].sign}{won(e.amount)}
                        </strong>
                        <div className="e-act">
                          <button className="btn btn-ghost btn-sm" onClick={() => setEntryModal(e)}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(e)}>×</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })
        )}
      </section>

      {entryModal && (
        <EntryModal
          entry={entryModal === 'new' ? null : entryModal}
          categories={ledgerCategories}
          onClose={() => setEntryModal(null)}
          onSave={async (patch) => {
            if (entryModal === 'new') await addLedgerEntry(patch)
            else await editLedgerEntry(entryModal.id, patch)
            setEntryModal(null)
          }}
        />
      )}

      {catModal && (
        <CategoryManager
          categories={ledgerCategories}
          onClose={() => setCatModal(null)}
          onAdd={addLedgerCategory}
          onEdit={editLedgerCategory}
          onRemove={(c) => setConfirm({ ...c, _cat: true })}
        />
      )}

      {confirm && (
        <Confirm
          message={
            confirm._cat
              ? `「${confirm.name}」 카테고리를 삭제할까요?`
              : `「${confirm.title}」 내역을 삭제할까요?`
          }
          detail={confirm._cat ? '이 카테고리를 쓰던 내역은 미분류가 돼요.' : undefined}
          onCancel={() => setConfirm(null)}
          onOk={async () => {
            if (confirm._cat) await removeLedgerCategory(confirm.id)
            else await removeLedgerEntry(confirm.id)
            setConfirm(null)
          }}
        />
      )}
    </>
  )
}

/* ===========================================================
   내역 추가/수정
   =========================================================== */
function EntryModal({ entry, categories, onClose, onSave }) {
  const [f, setF] = useState({
    kind: entry?.kind ?? 'expense',
    title: entry?.title ?? '',
    amount: entry?.amount != null ? String(entry.amount) : '',
    category_id: entry?.category_id ?? '',
    entry_date: entry?.entry_date ?? today(),
    memo: entry?.memo ?? '',
  })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  const cats = categories.filter((c) => c.kind === f.kind)
  const amountNum = Number(String(f.amount).replace(/[^\d]/g, '')) || 0

  function submit(e) {
    e.preventDefault()
    if (!f.title.trim() || amountNum <= 0) return
    onSave({
      kind: f.kind,
      title: f.title.trim(),
      amount: amountNum,
      category_id: f.category_id || null,
      entry_date: f.entry_date,
      memo: f.memo,
    })
  }

  return (
    <Modal
      title={entry ? '✏️ 내역 수정' : '＋ 새 내역'}
      onClose={onClose}
      width="440px"
      footer={
        <>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn-primary" form="entry-form" type="submit">저장</button>
        </>
      }
    >
      <form id="entry-form" onSubmit={submit}>
        <div className="kind-switch">
          {['expense', 'income'].map((k) => (
            <button
              type="button" key={k}
              className={'ks' + (f.kind === k ? ' on ' + k : '')}
              onClick={() => setF((s) => ({ ...s, kind: k, category_id: '' }))}
            >
              {KIND[k].sign} {KIND[k].label}
            </button>
          ))}
        </div>

        <div className="field">
          <label>금액 *</label>
          <div className="amount-box">
            <input
              className="input amount-in"
              inputMode="numeric"
              value={amountNum ? won(amountNum) : ''}
              onChange={(e) => setF((s) => ({ ...s, amount: e.target.value.replace(/[^\d]/g, '') }))}
              placeholder="0"
              autoFocus
            />
            <span>원</span>
          </div>
        </div>

        <div className="field">
          <label>내용 *</label>
          <input
            className="input" value={f.title} onChange={set('title')}
            placeholder="마라샹궈"
          />
        </div>

        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>카테고리</label>
            <select className="select" value={f.category_id} onChange={set('category_id')}>
              <option value="">— 미분류 —</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>날짜</label>
            <input className="input" type="date" value={f.entry_date} onChange={set('entry_date')} />
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>메모</label>
          <input className="input" value={f.memo} onChange={set('memo')} />
        </div>
      </form>
    </Modal>
  )
}

/* ===========================================================
   카테고리 관리
   =========================================================== */
function CategoryManager({ categories, onClose, onAdd, onEdit, onRemove }) {
  const [kind, setKind] = useState('expense')
  const [editing, setEditing] = useState(null)   // 'new' | category

  const list = categories.filter((c) => c.kind === kind)

  if (editing) {
    return (
      <CatEditModal
        cat={editing === 'new' ? null : editing}
        kind={kind}
        onClose={() => setEditing(null)}
        onSave={async (patch) => {
          if (editing === 'new') {
            await onAdd({ ...patch, kind, sort_order: list.length + 1 })
          } else {
            await onEdit(editing.id, patch)
          }
          setEditing(null)
        }}
      />
    )
  }

  return (
    <Modal
      title="🏷 카테고리 관리"
      onClose={onClose}
      width="420px"
      footer={<button className="btn" onClick={onClose}>닫기</button>}
    >
      <div className="kind-switch" style={{ marginBottom: 14 }}>
        {['expense', 'income'].map((k) => (
          <button key={k} className={'ks' + (kind === k ? ' on ' + k : '')} onClick={() => setKind(k)}>
            {KIND[k].label}
          </button>
        ))}
      </div>

      <ul className="mini-list">
        {list.map((c) => (
          <li key={c.id}>
            <span className="badge" style={{ background: c.color }}>{c.emoji}</span>
            <span className="ttl">{c.name}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>✏️</button>
            <button className="btn btn-ghost btn-sm" onClick={() => onRemove(c)}>×</button>
          </li>
        ))}
      </ul>

      <button
        className="btn btn-ghost btn-sm add-btn"
        style={{ marginTop: 10 }}
        onClick={() => setEditing('new')}
      >+ 카테고리 추가</button>
    </Modal>
  )
}

function CatEditModal({ cat, kind, onClose, onSave }) {
  const [name, setName] = useState(cat?.name ?? '')
  const [emoji, setEmoji] = useState(cat?.emoji ?? EMOJIS[0])
  const [color, setColor] = useState(cat?.color ?? COLORS[0])

  return (
    <Modal
      title={cat ? '✏️ 카테고리 수정' : `＋ 새 ${KIND[kind].label} 카테고리`}
      onClose={onClose}
      width="400px"
      footer={
        <>
          <button className="btn" onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            onClick={() => name.trim() && onSave({ name: name.trim(), emoji, color })}
          >저장</button>
        </>
      }
    >
      <div className="field">
        <label>이름</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div className="field">
        <label>아이콘</label>
        <div className="row-wrap">
          {EMOJIS.map((e) => (
            <button key={e} className={'mood' + (emoji === e ? ' on' : '')} onClick={() => setEmoji(e)}>{e}</button>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>그래프 색</label>
        <div className="row-wrap">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: c,
                border: color === c ? '3px solid var(--ink-soft)' : '2px solid var(--line-dp)',
              }}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
