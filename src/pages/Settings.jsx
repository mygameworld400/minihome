import { useState } from 'react'
import { useStore } from '../hooks/useStore'
import { useAuth } from '../hooks/useAuth'
import Modal, { Confirm } from '../components/common/Modal'

const AVATARS = ['🐰', '🐻', '🐼', '🐨', '🐤', '🐱', '🐶', '🦊', '🐧', '☁️', '🌷', '⭐']
const EMOJIS = ['📁', '☕', '📝', '📣', '🎬', '🏠', '💬', '⭐', '📦', '📱', '✨', '🎨']
const COLORS = ['#ffd9e6', '#e8f4ff', '#ffe9c7', '#e6e2ff', '#d9f2e6', '#fff6c7', '#ffe3f1', '#f0e6ff']

export default function Settings() {
  const {
    profile, saveProfile,
    tracks, addTrack, editTrack, removeTrack,
    people, addPerson, editPerson, removePerson,
  } = useStore()
  const { user } = useAuth()

  const [p, setP] = useState({
    nickname: profile?.nickname ?? '',
    bio: profile?.bio ?? '',
    avatar_emoji: profile?.avatar_emoji ?? '🐰',
    status: profile?.status ?? '',
    mood: profile?.mood ?? '😊',
  })
  const [saved, setSaved] = useState(false)
  const [trackModal, setTrackModal] = useState(null)
  const [personModal, setPersonModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const set = (k) => (e) => { setP((s) => ({ ...s, [k]: e.target.value })); setSaved(false) }

  return (
    <>
      <div className="page-head"><h1>⚙️ 설정</h1></div>

      {/* ── 프로필 ─────────────────────────────────────────── */}
      <section className="card">
        <h2 className="card-title">🙂 프로필</h2>
        <div className="grid grid-2" style={{ gap: 12 }}>
          <div className="field">
            <label>닉네임</label>
            <input className="input" value={p.nickname} onChange={set('nickname')} />
          </div>
          <div className="field">
            <label>현재 상태</label>
            <input className="input" value={p.status} onChange={set('status')} placeholder="작업중" />
          </div>
        </div>
        <div className="field">
          <label>한줄 소개</label>
          <input className="input" value={p.bio} onChange={set('bio')} />
        </div>
        <div className="field">
          <label>프로필 아이콘</label>
          <div className="row-wrap">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={'mood' + (p.avatar_emoji === a ? ' on' : '')}
                onClick={() => { setP((s) => ({ ...s, avatar_emoji: a })); setSaved(false) }}
              >{a}</button>
            ))}
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={async () => { await saveProfile(p); setSaved(true) }}
        >저장</button>
        {saved && <span className="tiny" style={{ color: 'var(--ok)', marginLeft: 8 }}>저장했어요 ✓</span>}
      </section>

      {/* ── 트랙 ───────────────────────────────────────────── */}
      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="card-title">
          📁 업무 트랙
          <button className="btn btn-primary btn-sm sub" onClick={() => setTrackModal('new')}>+ 추가</button>
        </h2>
        <ul className="mini-list">
          {tracks.map((t) => (
            <li key={t.id}>
              <span className="badge" style={{ background: t.color }}>{t.emoji}</span>
              <span className="ttl">{t.name}</span>
              <span className="tiny muted">#{t.sort_order}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setTrackModal(t)}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm({ kind: 'track', row: t })}>×</button>
            </li>
          ))}
        </ul>
      </section>

      {/* ── 담당자 ─────────────────────────────────────────── */}
      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="card-title">
          🙋 담당자
          <button className="btn btn-primary btn-sm sub" onClick={() => setPersonModal('new')}>+ 추가</button>
        </h2>
        <ul className="mini-list">
          {people.map((x) => (
            <li key={x.id}>
              <span className="badge" style={{ background: x.color }}>{x.emoji}</span>
              <span className="ttl">{x.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setPersonModal(x)}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirm({ kind: 'person', row: x })}>×</button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="card-title">🔐 계정</h2>
        <p className="tiny muted" style={{ margin: 0 }}>
          로그인 계정: {user?.email}
        </p>
      </section>

      {trackModal && (
        <ItemModal
          title={trackModal === 'new' ? '＋ 새 트랙' : '✏️ 트랙 수정'}
          item={trackModal === 'new' ? null : trackModal}
          emojis={EMOJIS} colors={COLORS} withDesc
          onClose={() => setTrackModal(null)}
          onSave={async (patch) => {
            if (trackModal === 'new') {
              await addTrack({ ...patch, sort_order: (tracks.at(-1)?.sort_order ?? 0) + 1 })
            } else await editTrack(trackModal.id, patch)
            setTrackModal(null)
          }}
        />
      )}

      {personModal && (
        <ItemModal
          title={personModal === 'new' ? '＋ 새 담당자' : '✏️ 담당자 수정'}
          item={personModal === 'new' ? null : personModal}
          emojis={AVATARS} colors={COLORS}
          onClose={() => setPersonModal(null)}
          onSave={async (patch) => {
            if (personModal === 'new') {
              await addPerson({ ...patch, sort_order: (people.at(-1)?.sort_order ?? 0) + 1 })
            } else await editPerson(personModal.id, patch)
            setPersonModal(null)
          }}
        />
      )}

      {confirm && (
        <Confirm
          message={`「${confirm.row.name}」 삭제할까요?`}
          detail={
            confirm.kind === 'track'
              ? '이 트랙의 업무는 지워지지 않고 「트랙 없음」으로 이동해요.'
              : '이 담당자에게 배정된 업무는 미지정으로 바뀌어요.'
          }
          onCancel={() => setConfirm(null)}
          onOk={async () => {
            if (confirm.kind === 'track') await removeTrack(confirm.row.id)
            else await removePerson(confirm.row.id)
            setConfirm(null)
          }}
        />
      )}
    </>
  )
}

function ItemModal({ title, item, emojis, colors, withDesc, onClose, onSave }) {
  const [f, setF] = useState({
    name: item?.name ?? '',
    emoji: item?.emoji ?? emojis[0],
    color: item?.color ?? colors[0],
    description: item?.description ?? '',
  })

  return (
    <Modal
      title={title}
      onClose={onClose}
      width="400px"
      footer={
        <>
          <button className="btn" onClick={onClose}>취소</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!f.name.trim()) return
              const patch = { name: f.name.trim(), emoji: f.emoji, color: f.color }
              if (withDesc) patch.description = f.description
              onSave(patch)
            }}
          >저장</button>
        </>
      }
    >
      <div className="field">
        <label>이름</label>
        <input className="input" value={f.name} onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))} autoFocus />
      </div>
      {withDesc && (
        <div className="field">
          <label>설명</label>
          <input className="input" value={f.description} onChange={(e) => setF((s) => ({ ...s, description: e.target.value }))} />
        </div>
      )}
      <div className="field">
        <label>아이콘</label>
        <div className="row-wrap">
          {emojis.map((e) => (
            <button key={e} className={'mood' + (f.emoji === e ? ' on' : '')} onClick={() => setF((s) => ({ ...s, emoji: e }))}>{e}</button>
          ))}
        </div>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label>색</label>
        <div className="row-wrap">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => setF((s) => ({ ...s, color: c }))}
              style={{
                width: 30, height: 30, borderRadius: '50%', background: c,
                border: f.color === c ? '3px solid var(--ink-soft)' : '2px solid var(--line-dp)',
              }}
            />
          ))}
        </div>
      </div>
    </Modal>
  )
}
