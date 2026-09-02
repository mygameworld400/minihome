import { useState } from 'react'
import { useStore } from '../../hooks/useStore'
import Modal from '../common/Modal'

/* ===========================================================
   업무 ON/OFF — "다음날"의 기준.

   ON  : 업무 상태
   OFF : 업무 아닌 상태

   OFF 로 껐다가 다시 ON 으로 켜면 하루가 새로 시작되고,
   완료·진행중이던 업무가 전부 대기 상태로 돌아온다.
   게임에서 "다음날" 버튼을 누르는 것과 같다.
   =========================================================== */

export default function DaySwitch() {
  const { workMode, setWorkMode, tasks } = useStore()
  const [ask, setAsk] = useState(false)
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState(null)

  const doneCount = tasks.filter((t) => t.status === 'done' || t.status === 'doing').length

  async function click() {
    if (workMode) {
      /* 켜져 있으면 그냥 끈다 — 되돌릴 수 있으니 확인하지 않는다 */
      setBusy(true)
      await setWorkMode(false)
      setBusy(false)
      return
    }
    /* 꺼진 걸 켜면 하루가 넘어간다 — 체크가 전부 풀리므로 확인 */
    setAsk(true)
  }

  async function confirmNewDay() {
    setBusy(true)
    const n = await setWorkMode(true)
    setBusy(false)
    setAsk(false)
    setFlash(n)
    setTimeout(() => setFlash(null), 2600)
  }

  return (
    <>
      <button
        className={'day-switch' + (workMode ? ' on' : '')}
        onClick={click}
        disabled={busy}
        title={workMode ? '업무 상태 — 누르면 하루를 마칩니다' : '업무 아닌 상태 — 누르면 다음날이 시작됩니다'}
        aria-pressed={workMode}
      >
        <span className="ds-face">{workMode ? '🌞' : '🌙'}</span>
        <span className="ds-text">
          <em>{workMode ? 'ON' : 'OFF'}</em>
          <b>{workMode ? '업무 중' : '다음날로'}</b>
        </span>
        <i className="ds-track"><s /></i>
      </button>

      {flash !== null && (
        <div className="day-flash pop">
          ☀️ 새로운 하루 시작! 업무 {flash}개가 대기로 돌아왔어요
        </div>
      )}

      {ask && (
        <Modal
          title="🌞 다음날로 넘어갈까요?"
          onClose={() => setAsk(false)}
          width="380px"
          footer={
            <>
              <button className="btn" onClick={() => setAsk(false)}>아직요</button>
              <button className="btn btn-primary" onClick={confirmNewDay} disabled={busy}>
                {busy ? '넘기는 중…' : '다음날 시작'}
              </button>
            </>
          }
        >
          <p style={{ margin: 0 }}>
            모든 업무가 <b>대기 상태</b>로 돌아옵니다.
            {doneCount > 0 && <> 지금 체크된 <b>{doneCount}개</b>도 풀려요.</>}
          </p>
          <p className="tiny muted" style={{ marginBottom: 0 }}>
            완료 기록은 통계에 그대로 남습니다. 보류(⏳)는 그대로 두고요.
          </p>
        </Modal>
      )}
    </>
  )
}
