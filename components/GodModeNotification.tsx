import type React from "react"
import { Sparkles } from "lucide-react"
import styles from "@/styles/GodModeNotification.module.css"

interface GodModeNotificationProps {
  isActive: boolean
  pressesLeft: number
}

const GodModeNotification: React.FC<GodModeNotificationProps> = ({ isActive, pressesLeft }) => {
  if (!isActive) return null

  return (
    <div className={styles.godModeNotification}>
      <Sparkles className={styles.icon} />
      <span className={styles.text}>
        GOD MODE: {pressesLeft} {pressesLeft === 1 ? "PRESS" : "PRESSES"} LEFT
      </span>
    </div>
  )
}

export default GodModeNotification

