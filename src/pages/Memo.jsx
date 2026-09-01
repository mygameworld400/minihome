import { useMemo, useState } from 'react'
import { useStore } from '../hooks/useStore'
import Modal, { Confirm } from '../components/common/Modal'

const PAPER = ['#fff6c7', '#ffd9e6', '#e8f4ff', '#e6e2ff', '#d9f2e6', '#ffe9c7']

export default function Memo() {
  const { memos, addMemo, editMemo, removeMemo } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [editing, setEditing] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const cats = useMemo(
    () => [...new Set(memos.map((m) => m.category).filter(Boolean))],
    [memos],
  )

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return memos.filter((m) => {
      if (cat && m.category !== cat) return false
      if (!kw) return true
      return (
        m.title.toLowerCase().includes(kw) ||
        m.content.toLowerCase().includes(kw) ||
        (m.tags ?? []).some((t) => t.toLowerCase().includes(kw))
      )
    })
  }, [memos, q, cat])

  return (
    <>
      <div className="page-head">
        <h1>📝 메모</h1>
        <button className="btn btn-primary btn-sm spacer" onClick={() => setEditing('new')}>+ 새 메모</button>
      </div>

      <section className="card filters">
        <input
          className="input" placeholder="🔍 제목·내용·태그 검색…"
          value={q} onChange={(e) => setQ(e.target.value)}
        />
        <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">전체 카테고리</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="tiny muted">{list.length}개</span>
      </section>

      {list.length === 0 ? (
        <div className="empty">메모가 없어요 ✏️</div>
      ) : (
        <div className="board">
          {list.map((m, i) => (
            <article
              key={m.id}
              className="card pop"
              style={{
                background: PAPER[i % PAPER.length],
                borderColor: 'rgba(0,0,0,0.06)',
                position: 'relative',
              }}
            >
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: 17, flex: 1, wordBreak: 'break-word' }}>
                  {m.title || '(제목 없음)'}
                </h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(m)}>✏️</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(m)}>×</button>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: 15, margin: '8px 0', wordBreak: 'break-word' }}>
                {m.content}
              </p>
              <div className="row-wrap tiny">
                <span className="badge">{m.category}</span>
                {(m.tags ?? []).map((t) => <span key={t} className="badge">#{t}</span>)}
                <span className="muted" style={{ marginLeft: 'auto' }}>
                  {new Date(m.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <MemoModal
          memo={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            if (editing === 'new') await addMemo(patch)
            else await editMemo(editing.id, patch)
            setEditing(null)
          }}
        />
      )}

      {confirm && (
        <Confirm
          message={`「${confirm.title || '제목 없음'}」 메모를 삭제할까요?`}
          onCancel={() => setConfirm(null)}
          onOk={async () => { await removeMemo(confirm.id); setConfirm(null) }}
        />
      )}
    </>
  )
}

function MemoModal({ memo, onClose, onSave }) {
  const [f, setF] = useState({
    title: memo?.title ?? '',
    content: memo?.content ?? '',
    category: memo?.category ?? '일상',
    tags: (memo?.tags ?? []).join(', '),
  })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))

  return (
    <Modal
      title={memo ? '✏️ 메모 수정' : '＋ 새 메모'}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            onClick={() =>
              onSave({
                title: f.title.trim(),
                content: f.content,
                category: f.category.trim() || '일상',
                tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean),
              })
            }
          >저장</button>
        </>
      }
    >
      <div className="field">
        <label>제목</label>
        <input className="input" value={f.title} onChange={set('title')} autoFocus />
      </div>
      <div className="field">
        <label>내용</label>
        <textarea className="textarea" rows={7} value={f.content} onChange={set('content')} />
      </div>
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>카테고리</label>
          <input className="input" value={f.category} onChange={set('category')} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>태그 (쉼표로 구분)</label>
          <input className="input" value={f.tags} onChange={set('tags')} placeholder="아이디어, 급함" />
        </div>
      </div>
    </Modal>
  )
}
