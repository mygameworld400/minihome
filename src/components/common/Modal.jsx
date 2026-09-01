import { useEffect } from 'react'

/** 공통 모달. ESC 로 닫히고 배경 클릭으로도 닫힌다. */
export default function Modal({ title, onClose, children, footer, width }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={width ? { width: `min(${width}, 100%)` } : undefined}>
        {title && <h2>{title}</h2>}
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

/** 삭제 등 되돌릴 수 없는 동작 확인용. */
export function Confirm({ message, detail, onCancel, onOk, okLabel = '삭제' }) {
  return (
    <Modal
      title="잠깐만요 🥺"
      onClose={onCancel}
      width="380px"
      footer={
        <>
          <button className="btn" onClick={onCancel}>취소</button>
          <button className="btn btn-danger" onClick={onOk}>{okLabel}</button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 17 }}>{message}</p>
      {detail && <p className="muted tiny" style={{ marginBottom: 0 }}>{detail}</p>}
    </Modal>
  )
}
