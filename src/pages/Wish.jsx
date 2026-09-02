import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import Modal, { Confirm } from '../components/common/Modal'
import './wish.css'

const ICONS = [
  '👗', '👜', '💄', '🍰', '🗺️', '👟', '💍', '🕶️',
  '📚', '🎧', '🪴', '🍜', '☕', '✈️', '🎁', '💝',
]
const COLORS = [
  '#ffd9e6', '#e6e2ff', '#ffe3f1', '#fff6c7',
  '#e8f4ff', '#d9f2e6', '#ffe9c7', '#f0e6ff',
]

const won = (n) => (n ?? 0).toLocaleString('ko-KR')

export default function Wish() {
  const {
    wishCategories, wishes,
    addWishCategory, editWishCategory, removeWishCategory,
    addWish, editWish, removeWish,
  } = useStore()

  const [hideGot, setHideGot] = useState(false)
  const [newIn, setNewIn] = useState(null)
  const [catModal, setCatModal] = useState(null)   // 'new' | category
  const [itemModal, setItemModal] = useState(null) // { wish } | { categoryId }
  const [confirm, setConfirm] = useState(null)

  const grouped = useMemo(
    () =>
      wishCategories.map((c) => ({
        cat: c,
        items: wishes
          .filter((w) => w.category_id === c.id)
          .filter((w) => !hideGot || !w.got)
          .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id),
        all: wishes.filter((w) => w.category_id === c.id),
      })),
    [wishCategories, wishes, hideGot],
  )

  const total = wishes.length
  const gotCount = wishes.filter((w) => w.got).length

  async function quickAdd(e, catId) {
    e.preventDefault()
    const input = e.target.elements.title
    const title = input.value.trim()
    if (!title) return
    const sib = wishes.filter((w) => w.category_id === catId)
    const next = sib.length ? Math.max(...sib.map((w) => w.sort_order)) + 1 : 1
    await addWish({ title, category_id: catId, sort_order: next })
    input.value = ''
    input.focus()
  }

  return (
    <>
      <div className="page-head">
        <h1>💝 위시리스트</h1>
        <span className="spacer tiny muted">{gotCount} / {total} 완료</span>
        <label className="chk-inline">
          <input type="checkbox" checked={hideGot} onChange={(e) => setHideGot(e.target.checked)} />
          완료 숨기기
        </label>
        <button className="btn btn-primary btn-sm" onClick={() => setCatModal('new')}>
          + 카테고리
        </button>
      </div>

      {wishCategories.length === 0 ? (
        <div className="empty">카테고리를 하나 만들어볼까요? 🎁</div>
      ) : (
        <div className="board">
          {grouped.map(({ cat, items, all }) => {
            const got = all.filter((w) => w.got).length
            const sum = all.filter((w) => !w.got).reduce((a, w) => a + (w.price ?? 0), 0)
            return (
              <section className="card track" key={cat.id} style={{ borderColor: cat.color }}>
                <h2 className="card-title track-head" style={{ background: cat.color }}>
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                  <span className="sub">
                    {got}/{all.length}
                    <button
                      className="btn btn-ghost btn-sm track-edit"
                      onClick={() => setCatModal(cat)}
                      title="카테고리 수정"
                    >✏️</button>
                  </span>
                </h2>

                {sum > 0 && (
                  <p className="wish-sum tiny">
                    담아둔 것 합계 <b>{won(sum)}원</b>
                  </p>
                )}

                {items.length === 0 ? (
                  <div className="empty tiny">비어 있어요</div>
                ) : (
                  <ul className="wish-list">
                    {items.map((w) => (
                      <li key={w.id} className={'wish' + (w.got ? ' is-got' : '')}>
                        <button
                          className={'chk' + (w.got ? ' on' : '')}
                          onClick={() => editWish(w.id, { got: !w.got })}
                          title={w.got ? '되돌리기' : '가졌어요 / 가봤어요'}
                        >{w.got ? '✓' : ''}</button>

                        <div className="w-body">
                          <div className="w-title">
                            {w.url ? (
                              <a href={w.url} target="_blank" rel="noreferrer noopener">
                                {w.title} <span className="w-link">↗</span>
                              </a>
                            ) : w.title}
                          </div>
                          <div className="row-wrap w-meta">
                            {w.price ? <span className="badge">{won(w.price)}원</span> : null}
                            {w.memo && <span className="tiny muted">{w.memo}</span>}
                          </div>
                        </div>

                        <div className="w-act">
                          <button className="btn btn-ghost btn-sm" onClick={() => setItemModal({ wish: w })}>✏️</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setConfirm({ kind: 'wish', row: w })}>×</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {newIn === cat.id ? (
                  <form className="quick" onSubmit={(e) => quickAdd(e, cat.id)}>
                    <input
                      className="input" name="title" autoFocus
                      placeholder="이름 입력 후 엔터…"
                      onBlur={(e) => { if (!e.target.value.trim()) setNewIn(null) }}
                    />
                  </form>
                ) : (
                  <div className="row" style={{ marginTop: 8, gap: 6 }}>
                    <button className="btn btn-ghost btn-sm add-btn" onClick={() => setNewIn(cat.id)}>
                      + 빠른 추가
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setItemModal({ categoryId: cat.id })}
                      title="자세히 입력"
                    >＋</button>
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      {catModal && (
        <CategoryModal
          cat={catModal === 'new' ? null : catModal}
          onClose={() => setCatModal(null)}
          onSave={async (patch) => {
            if (catModal === 'new') {
              await addWishCategory({ ...patch, sort_order: wishCategories.length + 1 })
            } else {
              await editWishCategory(catModal.id, patch)
            }
            setCatModal(null)
          }}
          onDelete={() => { setConfirm({ kind: 'cat', row: catModal }); setCatModal(null) }}
        />
      )}

      {itemModal && (
        <WishModal
          wish={itemModal.wish ?? null}
          categories={wishCategories}
          defaultCategoryId={itemModal.categoryId}
          onClose={() => setItemModal(null)}
          onSave={async (patch) => {
            if (itemModal.wish) await editWish(itemModal.wish.id, patch)
            else {
              const sib = wishes.filter((w) => w.category_id === patch.category_id)
              const next = sib.length ? Math.max(...sib.map((w) => w.sort_order)) + 1 : 1
              await addWish({ ...patch, sort_order: next })
            }
            setItemModal(null)
          }}
        />
      )}

      {confirm && (
        <Confirm
          message={
            confirm.kind === 'cat'
              ? `「${confirm.row.name}」 카테고리를 삭제할까요?`
              : `「${confirm.row.title}」 삭제할까요?`
          }
          detail={confirm.kind === 'cat' ? '안에 담아둔 것도 함께 사라져요.' : undefined}
          onCancel={() => setConfirm(null)}
          onOk={async () => {
            if (confirm.kind === 'cat') await removeWishCategory(confirm.row.id)
            else await removeWish(confirm.row.id)
            setConfirm(null)
          }}
        />
      )}
    </>
  )
}

/* ── 항목 자세히 입력 ────────────────────────────────────── */
function WishModal({ wish, categories, defaultCategoryId, onClose, onSave }) {
  const [f, setF] = useState({
    title: wish?.title ?? '',
    category_id: wish?.category_id ?? defaultCategoryId ?? categories[0]?.id ?? '',
    url: wish?.url ?? '',
    price: wish?.price != null ? String(wish.price) : '',
    memo: wish?.memo ?? '',
  })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const priceNum = Number(String(f.price).replace(/[^\d]/g, '')) || 0

  function submit(e) {
    e.preventDefault()
    if (!f.title.trim()) return
    onSave({
      title: f.title.trim(),
      category_id: f.category_id || null,
      url: f.url.trim(),
      price: priceNum || null,
      memo: f.memo.trim(),
    })
  }

  return (
    <Modal
      title={wish ? '✏️ 위시 수정' : '＋ 위시 추가'}
      onClose={onClose}
      width="420px"
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>취소</button>
          <button type="submit" form="wish-form" className="btn btn-primary">저장</button>
        </>
      }
    >
      <form id="wish-form" onSubmit={submit}>
        <div className="field">
          <label>이름 *</label>
          <input className="input" value={f.title} onChange={set('title')} required autoFocus />
        </div>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>카테고리</label>
            <select className="select" value={f.category_id} onChange={set('category_id')}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>가격</label>
            <input
              className="input" inputMode="numeric" placeholder="선택"
              value={priceNum ? won(priceNum) : ''}
              onChange={(e) => setF((s) => ({ ...s, price: e.target.value.replace(/[^\d]/g, '') }))}
            />
          </div>
        </div>
        <div className="field">
          <label>링크</label>
          <input
            className="input" value={f.url} onChange={set('url')}
            placeholder="쇼핑몰 / 지도 주소"
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>메모</label>
          <input className="input" value={f.memo} onChange={set('memo')} placeholder="사이즈, 색상, 위치…" />
        </div>
      </form>
    </Modal>
  )
}

/* ── 카테고리 ────────────────────────────────────────────── */
function CategoryModal({ cat, onClose, onSave, onDelete }) {
  const [name, setName] = useState(cat?.name ?? '')
  const [icon, setIcon] = useState(cat?.icon ?? ICONS[0])
  const [color, setColor] = useState(cat?.color ?? COLORS[0])

  return (
    <Modal
      title={cat ? '✏️ 카테고리 수정' : '＋ 새 카테고리'}
      onClose={onClose}
      width="400px"
      footer={
        <>
          {cat && (
            <button className="btn btn-danger" style={{ marginRight: 'auto' }} onClick={onDelete}>
              삭제
            </button>
          )}
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
