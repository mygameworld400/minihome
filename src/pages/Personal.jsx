import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import Modal, { Confirm } from '../components/common/Modal'

const ICONS = ['🌷', '💰', '📚', '📝', '💡', '❤️', '🏃', '🍰', '🛒', '✨', '🎵', '🧺']
const COLORS = ['#ffd9e6', '#fff6c7', '#e8f4ff', '#e6e2ff', '#d9f2e6', '#ffe9c7']

export default function Personal() {
  const {
    categories, personalTasks,
    addCategory, editCategory, removeCategory,
    addPersonalTask, editPersonalTask, removePersonalTask,
  } = useStore()

  const [newIn, setNewIn] = useState(null)
  const [catModal, setCatModal] = useState(null)   // 'new' | category
  const [confirm, setConfirm] = useState(null)

  const grouped = useMemo(
    () =>
      categories.map((c) => ({
        cat: c,
        items: personalTasks
          .filter((t) => t.category_id === c.id)
          .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
      })),
    [categories, personalTasks],
  )

  async function quickAdd(e, catId) {
    e.preventDefault()
    const input = e.target.elements.title
    const title = input.value.trim()
    if (!title) return
    const sib = personalTasks.filter((t) => t.category_id === catId)
    const next = sib.length ? Math.max(...sib.map((t) => t.sort_order)) + 1 : 1
    await addPersonalTask({ title, category_id: catId, sort_order: next })
    input.value = ''
    input.focus()
  }

  const isMoney = (name) => name.includes('지출') || name.includes('돈')

  return (
    <>
      <div className="page-head">
        <h1>🌷 개인보드</h1>
        <button className="btn btn-primary btn-sm spacer" onClick={() => setCatModal('new')}>
          + 카테고리
        </button>
      </div>

      <div className="board">
        {grouped.map(({ cat, items }) => {
          const done = items.filter((t) => t.status === 'done').length
          const sum = items.reduce((a, t) => a + (t.amount ?? 0), 0)
          return (
            <section className="card track" key={cat.id} style={{ borderColor: cat.color }}>
              <h2 className="card-title track-head" style={{ background: cat.color }}>
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="sub">
                  {isMoney(cat.name) && sum > 0
                    ? `${sum.toLocaleString()}원`
                    : `${done}/${items.length}`}
                </span>
              </h2>

              {items.length === 0 ? (
                <div className="empty tiny">비어 있어요</div>
              ) : (
                <ul className="mini-list">
                  {items.map((t) => (
                    <li key={t.id}>
                      <button
                        className={'chk' + (t.status === 'done' ? ' on' : '')}
                        onClick={() =>
                          editPersonalTask(t.id, {
                            status: t.status === 'done' ? 'todo' : 'done',
                          })
                        }
                      >
                        {t.status === 'done' ? '✓' : '○'}
                      </button>
                      <span
                        className="ttl"
                        style={
                          t.status === 'done'
                            ? { color: 'var(--ink-soft)', textDecoration: 'line-through' }
                            : undefined
                        }
                      >
                        {t.title}
                      </span>
                      {isMoney(cat.name) && (
                        <input
                          className="input amount"
                          type="number" inputMode="numeric" placeholder="0"
                          defaultValue={t.amount ?? ''}
                          onBlur={(e) => {
                            const v = e.target.value === '' ? null : Number(e.target.value)
                            if (v !== (t.amount ?? null)) editPersonalTask(t.id, { amount: v })
                          }}
                        />
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirm({ kind: 'task', row: t })}
                      >×</button>
                    </li>
                  ))}
                </ul>
              )}

              {newIn === cat.id ? (
                <form className="quick" onSubmit={(e) => quickAdd(e, cat.id)}>
                  <input
                    className="input" name="title" autoFocus
                    placeholder="입력 후 엔터…"
                    onBlur={(e) => { if (!e.target.value.trim()) setNewIn(null) }}
                  />
                </form>
              ) : (
                <div className="row" style={{ marginTop: 8, gap: 6 }}>
                  <button className="btn btn-ghost btn-sm add-btn" onClick={() => setNewIn(cat.id)}>
                    + 추가
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setCatModal(cat)}>⚙️</button>
                </div>
              )}
            </section>
          )
        })}
      </div>

      {catModal && (
        <CategoryModal
          cat={catModal === 'new' ? null : catModal}
          onClose={() => setCatModal(null)}
          onSave={async (patch) => {
            if (catModal === 'new') {
              await addCategory({ ...patch, sort_order: categories.length + 1 })
            } else {
              await editCategory(catModal.id, patch)
            }
            setCatModal(null)
          }}
          onDelete={() => { setConfirm({ kind: 'cat', row: catModal }); setCatModal(null) }}
        />
      )}

      {confirm && (
        <Confirm
          message={
            confirm.kind === 'cat'
              ? `「${confirm.row.name}」 카테고리를 삭제할까요?`
              : `「${confirm.row.title}」 삭제할까요?`
          }
          detail={confirm.kind === 'cat' ? '안에 있는 항목도 함께 사라져요.' : undefined}
          onCancel={() => setConfirm(null)}
          onOk={async () => {
            if (confirm.kind === 'cat') await removeCategory(confirm.row.id)
            else await removePersonalTask(confirm.row.id)
            setConfirm(null)
          }}
        />
      )}
    </>
  )
}

function CategoryModal({ cat, onClose, onSave, onDelete }) {
  const [name, setName] = useState(cat?.name ?? '')
  const [icon, setIcon] = useState(cat?.icon ?? '🌷')
  const [color, setColor] = useState(cat?.color ?? '#ffd9e6')

  return (
    <Modal
      title={cat ? '⚙️ 카테고리 수정' : '＋ 새 카테고리'}
      onClose={onClose}
      width="400px"
      footer={
        <>
          {cat && <button className="btn btn-danger" onClick={onDelete} style={{ marginRight: 'auto' }}>삭제</button>}
          <button className="btn" onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            onClick={() => name.trim() && onSave({ name: name.trim(), icon, color })}
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
          {ICONS.map((i) => (
            <button key={i} className={'mood' + (icon === i ? ' on' : '')} onClick={() => setIcon(i)}>{i}</button>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>색</label>
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
