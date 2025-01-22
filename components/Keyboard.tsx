import { useState, useEffect, useCallback } from "react"
import styles from "@/styles/Keyboard.module.css"
import { SoundControl } from "@/components/SoundControls"
import { Music, Volume2 } from "lucide-react"

interface KeyboardProps {
  onKeyPress: (key: string) => void
  usedKeys: Set<string>
  totalAttempts: number
  disabled: boolean
}

export default function Keyboard({ onKeyPress, usedKeys, totalAttempts, disabled }: KeyboardProps) {
  const [musicControlOpen, setMusicControlOpen] = useState(false)
  const [effectsControlOpen, setEffectsControlOpen] = useState(false)
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const keys = [
    ["Q", "W", "E", "R", "T", "Z", "U", "I", "O", "P"],
    ["dummy", "A", "S", "D", "F", "G", "H", "J", "K", "L", "dummy"],
    ["dummy", "Y", "X", "C", "V", "B", "N", "M", "dummy"],
  ]

  const handleSoundControlPress = useCallback((type: "music" | "effects") => {
    const timer = setTimeout(() => {
      if (type === "music") {
        setMusicControlOpen(true)
      } else {
        setEffectsControlOpen(true)
      }
    }, 500) // Long press threshold

    setLongPressTimer(timer)
  }, [])

  const handleSoundControlRelease = useCallback(
    (type: "music" | "effects") => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }

      // If it wasn't a long press, treat it as a click
      if ((type === "music" && !musicControlOpen) || (type === "effects" && !effectsControlOpen)) {
        // Toggle mute
        if (type === "music") {
          // Implement music mute toggle
        } else {
          // Implement effects mute toggle
        }
      }

      setLongPressTimer(null)
    },
    [longPressTimer, musicControlOpen, effectsControlOpen],
  )

  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer)
      }
    }
  }, [longPressTimer])

  return (
    <div className={styles.keyboard}>
      {keys.map((row, rowIndex) => (
        <div key={rowIndex} className={styles.row}>
          {row.map((key, index) => {
            if (key === "dummy" && index === 0 && rowIndex === 1) {
              return (
                <button
                  key={`${rowIndex}-${key}-${index}`}
                  className={`${styles.key} ${styles.dummy} ${styles.soundControl}`}
                  onMouseDown={() => handleSoundControlPress("music")}
                  onMouseUp={() => handleSoundControlRelease("music")}
                  onTouchStart={() => handleSoundControlPress("music")}
                  onTouchEnd={() => handleSoundControlRelease("music")}
                >
                  <Music size={16} />
                </button>
              )
            } else if (key === "dummy" && index === row.length - 1 && rowIndex === 1) {
              return (
                <button
                  key={`${rowIndex}-${key}-${index}`}
                  className={`${styles.key} ${styles.dummy} ${styles.soundControl}`}
                  onMouseDown={() => handleSoundControlPress("effects")}
                  onMouseUp={() => handleSoundControlRelease("effects")}
                  onTouchStart={() => handleSoundControlPress("effects")}
                  onTouchEnd={() => handleSoundControlRelease("effects")}
                >
                  <Volume2 size={16} />
                </button>
              )
            } else {
              return (
                <button
                  key={`${rowIndex}-${key}-${index}`}
                  className={`${styles.key} ${usedKeys?.has(key) ? styles.used : ""} ${key === "dummy" ? `${styles.dummy} ${styles.otherDummy}` : ""}`}
                  onClick={() => key !== "dummy" && onKeyPress(key)}
                  disabled={key === "dummy" || usedKeys?.has(key) || disabled || totalAttempts <= 0}
                >
                  {key !== "dummy" ? key : ""}
                </button>
              )
            }
          })}
        </div>
      ))}
      {musicControlOpen && (
        <div className={styles.soundControlPopup}>
          <SoundControl type="music" onClose={() => setMusicControlOpen(false)} />
        </div>
      )}
      {effectsControlOpen && (
        <div className={styles.soundControlPopup}>
          <SoundControl type="effects" onClose={() => setEffectsControlOpen(false)} />
        </div>
      )}
    </div>
  )
}

