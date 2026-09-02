import { useState } from 'react'
import Modal from '../common/Modal'
import { useStore } from '../../hooks/useStore'

const EMOJIS = [
  '📁', '☕', '📝', '📣', '🎬', '🏠', '💬', '⭐',
  '📦', '📱', '✨', '🎨', '🛒', '📊', '🔧', '🌱',
]
const COLORS = [
  '#ffd9e6', '#e8f4ff', '#ffe9c7', '#e6e2ff',
  '#d9f2e6', '#fff6c7', '#ffe3f1', '#f0e6ff',
  '#ffeaea', '#e0f0ff',
]

/** 업무 트랙(카페·블로그 같은 큰 덩어리) 추가/수정 모달.
    track 이 없으면 새로 만드는 모드. */
export default function TrackModal({ track, onClose, onDelete }) {
  const { tracks, addTrack, editTrack } = useStore()
  const isNew = !track

  const [f, setF] = useState({
    name: track?.name ?? '',
    description: track?.description ?? '',
    emoji: track?.emoji ?? '📁',
    color: track?.color ?? COLORS[0],
  })
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!f.name.trim()) return
    setBusy(true)
    const patch = {
      name: f.name.trim(),
      description: f.description.trim(),
      emoji: f.emoji,
      color: f.color,
    }
    try {
      if (isNew) {
        const last = tracks.at(-1)?.sort_order ?? 0
        /* 99 는 "새로운 제품 기획"이 늘 마지막에 오도록 잡아둔 자리다.
           새 트랙은 그 앞에 들어가게 한다. */
        await addTrack({ ...patch, sort_order: Math.min(last + 1, 98) })
      } else {
        await editTrack(track.id, patch)
      }
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      title={isNew ? '＋ 새 트랙' : '✏️ 트랙 수정'}
      onClose={onClose}
      width="420px"
      footer={
        <>
          {!isNew && (
            <button
              type="button"
              className="btn btn-danger"
              style={{ marginRight: 'auto' }}
              onClick={onDelete}
            >삭제</button>
          )}
          <button type="button" className="btn" onClick={onClose}>취소</button>
          <button type="submit" form="track-form" className="btn btn-primary" disabled={busy}>
            {busy ? '저장 중…' : '저장'}
          </button>
        </>
      }
    >
      <form id="track-form" onSubmit={submit}>
        <div className="field">
          <label>트랙 이름 *</label>
          <input
            className="input" value={f.name} required autoFocus
            placeholder="카페 / 블로그 / 마케팅…"
            onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
          />
        </div>

        <div className="field">
          <label>설명</label>
          <input
            className="input" value={f.description}
            placeholder="없어도 됩니다"
            onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))}
          />
        </div>

        <div className="field">
          <label>아이콘</label>
          <div className="row-wrap">
            {EMOJIS.map((e) => (
              <button
                type="button" key={e}
                className={'mood' + (f.emoji === e ? ' on' : '')}
                onClick={() => setF((s) => ({ ...s, emoji: e }))}
              >{e}</button>
            ))}
          </div>
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>색</label>
          <div className="row-wrap">
            {COLORS.map((c) => (
              <button
                type="button" key={c}
                onClick={() => setF((s) => ({ ...s, color: c }))}
                style={{
                  width: 30, height: 30, borderRadius: '50%', background: c,
                  border: f.color === c ? '3px solid var(--ink-soft)' : '2px solid var(--line-dp)',
                }}
              />
            ))}
          </div>
          <div className="track-preview" style={{ background: f.color }}>
            <span>{f.emoji}</span> <b>{f.name || '트랙 이름'}</b>
          </div>
        </div>
      </form>
    </Modal>
  )
}
