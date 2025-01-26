import { useState, useEffect, useCallback } from "react"
import styles from "@/styles/Keyboard.module.css"
import { SoundControl } from "@/components/SoundControls"
import { Music, Volume2 } from "lucide-react"

interface KeyboardProps {
  onKeyPress: (key: string) => void
  usedKeys: Set<string>
  totalAttempts: number
  disabled: boolean
  isTargetedResolution: boolean
  isMobileViewportAdjusted: boolean
  godModeReady: boolean
}

export default function Keyboard({
  onKeyPress,
  usedKeys,
  totalAttempts,
  disabled,
  isTargetedResolution,
  isMobileViewportAdjusted,
  godModeReady,
}: KeyboardProps) {
  const [openControl, setOpenControl] = useState<"music" | "effects" | null>(null)

  const keys = [
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P"],
    ["dummy", "A", "S", "D", "F", "G", "H", "J", "K", "L", "dummy"],
    ["dummy", "Y", "X", "C", "V", "B", "N", "M", "godModeReady"],
  ]

  const handleSoundControlPress = useCallback((type: "music" | "effects") => {
    setOpenControl((prev) => (prev === type ? null : type))
  }, [])

  const handleGodModeReady = () => {
    if (godModeReady) {
      console.log("God Mode activated!")
      onKeyPress("GODMODE")
    }
  }

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (openControl && !(event.target as Element).closest(`.${styles.soundControlPopup}`)) {
        setOpenControl(null)
      }
    }
    document.addEventListener("click", handleOutsideClick)
    return () => document.removeEventListener("click", handleOutsideClick)
  }, [openControl])

  return (
    <div
      className={`${styles.keyboard} ${isTargetedResolution ? styles.targetedResolution : ""} ${isMobileViewportAdjusted ? styles.mobileViewportAdjusted : ""}`}
    >
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {row.map((key, index) => {
            if (key === "dummy" && index === 0 && rowIndex === 1) {
              return (
                <button
                  key={`${rowIndex}-${key}-${index}`}
                  className={`${styles.key} ${styles.soundControl}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSoundControlPress("music")
                  }}
                >
                  <Music size={16} />
                </button>
              )
            } else if (key === "dummy" && index === row.length - 1 && rowIndex === 1) {
              return (
                <button
                  key={`${rowIndex}-${key}-${index}`}
                  className={`${styles.key} ${styles.soundControl}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSoundControlPress("effects")
                  }}
                >
                  <Volume2 size={16} />
                </button>
              )
            } else if (key === "godModeReady") {
              return (
                <button
                  key={`${rowIndex}-${key}-${index}`}
                  className={`${styles.key} ${styles.godModeReady} ${godModeReady ? styles.active : styles.inactive}`}
                  onClick={handleGodModeReady}
                  disabled={!godModeReady || (disabled && !godModeReady)}
                >
                  <span>GOD MODE</span>
                </button>
              )
            } else {
              return (
                <button
                  key={`${rowIndex}-${key}-${index}`}
                  className={`${styles.key} ${usedKeys?.has(key) ? styles.used : ""} ${
                    key === "dummy" ? `${styles.dummy} ${styles.otherDummy}` : ""
                  }`}
                  onClick={() => key !== "dummy" && onKeyPress(key)}
                  disabled={
                    key === "dummy" || usedKeys?.has(key) || (disabled && key !== "GODMODE") || totalAttempts <= 0
                  }
                >
                  {key !== "dummy" ? key : ""}
                </button>
              )
            }
          })}
        </div>
      ))}
      {openControl && (
        <div className={styles.soundControlPopup}>
          <SoundControl type={openControl} />
        </div>
      )}
    </div>
  )
}

