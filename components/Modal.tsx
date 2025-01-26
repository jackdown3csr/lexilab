import type React from "react"
import styles from "@/styles/Modal.module.css"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${styles.largeModal}`} onClick={(e) => e.stopPropagation()}>
        {title && <h2 className={styles.modalTitle}>{title}</h2>}
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        {children}
      </div>
    </div>
  )
}

export default Modal

