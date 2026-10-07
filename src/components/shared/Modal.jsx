import { useEffect, useRef } from 'react'
import './Modal.scss'

function Modal({ title, onClose, children, wide = false }) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Runs once on mount only — if this depended on `onClose` directly, the
  // effect would re-fire (and re-steal focus from whatever field the user is
  // typing in) on every parent re-render, since inline `onClose={() => ...}`
  // callbacks get a new identity each render.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`modal ${wide ? 'modal--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 id="modal-title">{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close dialog">
            &times;
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
