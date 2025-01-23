"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Volume2, VolumeX, Music, MicOffIcon as MusicOff, Plus, Minus } from "lucide-react"
import {
  setMusicVolume,
  setEffectsVolume,
  toggleMusicMute,
  toggleEffectsMute,
  getMusicMuted,
  getEffectsMuted,
  isSoundManagerReady,
  getMusicVolume,
  getEffectsVolume,
} from "@/utils/sounds"
import styles from "@/styles/SoundControls.module.css"

interface SoundControlProps {
  type: "music" | "effects"
  onClose?: () => void
}

export const SoundControl: React.FC<SoundControlProps> = ({ type, onClose }) => {
  const [volume, setVolume] = useState(type === "music" ? getMusicVolume() : getEffectsVolume())
  const [isMuted, setIsMuted] = useState(type === "music" ? getMusicMuted() : getEffectsMuted())
  const [isReady, setIsReady] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsReady(isSoundManagerReady())
  }, [])

  useEffect(() => {
    if (isReady) {
      if (type === "music") {
        setMusicVolume(volume)
      } else {
        setEffectsVolume(volume)
      }
    }
  }, [volume, isReady, type])

  const handleVolumeChange = (newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume)))
  }

  const handleMuteToggle = () => {
    if (isReady) {
      if (type === "music") {
        toggleMusicMute()
      } else {
        toggleEffectsMute()
      }
      setIsMuted(!isMuted)
    }
  }

  const handleMuteMouseDown = () => {
    holdTimerRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(holdTimerRef.current as NodeJS.Timeout)
          return 100
        }
        return prev + 5 // Increase by 5% every 100ms
      })
    }, 100)
  }

  const handleMuteMouseUp = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current)
    }
    if (holdProgress < 100) {
      setHoldProgress(0)
    } else {
      handleMuteToggle()
    }
  }

  if (!isReady) {
    return null
  }

  return (
    <div className={styles.soundControl}>
      <button
        onMouseDown={handleMuteMouseDown}
        onMouseUp={handleMuteMouseUp}
        onMouseLeave={handleMuteMouseUp}
        className={styles.muteButton}
      >
        {isMuted ? (
          type === "music" ? (
            <MusicOff size={16} />
          ) : (
            <VolumeX size={16} />
          )
        ) : type === "music" ? (
          <Music size={16} />
        ) : (
          <Volume2 size={16} />
        )}
        <div className={styles.holdIndicator} style={{ width: `${holdProgress}%` }} />
      </button>
      <div className={styles.volumeControl}>
        <button onClick={() => handleVolumeChange(volume - 0.1)} className={styles.volumeButton}>
          <Minus size={16} />
        </button>
        <span className={styles.volumeDisplay}>{Math.round(volume * 100)}%</span>
        <button onClick={() => handleVolumeChange(volume + 0.1)} className={styles.volumeButton}>
          <Plus size={16} />
        </button>
      </div>
      {onClose && (
        <button onClick={onClose} className={styles.closeButton}>
          X
        </button>
      )}
    </div>
  )
}

