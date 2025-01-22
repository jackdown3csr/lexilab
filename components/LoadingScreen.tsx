"use client"

import { useState, useEffect } from "react"
import styles from "@/styles/LoadingScreen.module.css"

interface LoadingScreenProps {
  onLoaded?: () => void
}

export default function LoadingScreen({ onLoaded }: LoadingScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState("Initializing...")

  useEffect(() => {
    const loadSteps = [
      { progress: 20, message: "Connecting to server..." },
      { progress: 40, message: "Fetching word data..." },
      { progress: 60, message: "Preparing game elements..." },
      { progress: 80, message: "Finalizing setup..." },
      { progress: 100, message: "Ready to play!" },
    ]

    let currentStep = 0
    const interval = setInterval(() => {
      if (currentStep < loadSteps.length) {
        setLoadingProgress(loadSteps[currentStep].progress)
        setLoadingMessage(loadSteps[currentStep].message)
        currentStep++
      } else {
        clearInterval(interval)
        if (onLoaded) {
          setTimeout(onLoaded, 1000) // Give a second to show 100% before calling onLoaded
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [onLoaded])

  return (
    <div className={styles.loadingScreen}>
      <h2 className={styles.loadingTitle}>LEXILAB</h2>
      <div className={styles.progressBar}>
        <div className={styles.progressFill} style={{ width: `${loadingProgress}%` }}></div>
      </div>
      <p className={styles.loadingMessage}>{loadingMessage}</p>
      <p className={styles.loadingPercentage}>Loaded {loadingProgress}%</p>
    </div>
  )
}

