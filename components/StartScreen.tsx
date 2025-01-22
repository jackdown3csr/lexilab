import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Clock, Star, Zap, Heart } from "lucide-react"
import styles from "@/styles/StartScreen.module.css"
import { playButtonClickSound } from "@/utils/sounds"

interface StartScreenProps {
  onStartGame: () => Promise<void>
}

export default function StartScreen({ onStartGame }: StartScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [animatedTitle, setAnimatedTitle] = useState("")
  const fullTitle = "LEXILAB"

  useEffect(() => {
    let index = 0
    const intervalId = setInterval(() => {
      setAnimatedTitle(() => {
        if (index < fullTitle.length) {
          index++
          const newTitle = fullTitle.slice(0, index)
          return newTitle
        }
        clearInterval(intervalId)
        return fullTitle // Ensure the full title is set at the end
      })
    }, 200)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {}, [animatedTitle])

  const handleStartGame = async () => {
    if (isLoading) return
    setIsLoading(true)
    playButtonClickSound()
    try {
      await onStartGame()
    } catch (error) {
      console.error("Error starting game:", error)
      setIsLoading(false)
    }
  }

  return (
    <div className={styles.startScreen}>
      <div className={styles.gameTitleContainer}>
        <h1 className={styles.gameTitle}>{animatedTitle}</h1>
      </div>
      <div className={styles.authors}>
        <span>BY </span>
        <span className={styles.authorName}>JACKDOWN3CSR</span>
        <span> & </span>
        <span className={styles.authorName}>ADDICTION</span>
      </div>
      <p className={styles.description}>
        Challenge your vocabulary and deduction skills in this thrilling word-guessing adventure. Decrypt hidden words,
        race against time, and aim for the highest score!
      </p>
      <div className={styles.rulesContainer}>
        <h3 className={styles.rulesTitle}>Game Rules</h3>
        <ul className={styles.rulesList}>
          <li>
            <Shield className={styles.ruleIcon} />
            <span>Decrypt hidden words using provided hints</span>
          </li>
          <li>
            <Heart className={styles.ruleIcon} />
            <span>10 lives for the entire game - use them wisely!</span>
          </li>
          <li>
            <Star className={styles.ruleIcon} />
            <span>Score points for correct guesses and completed words</span>
          </li>
          <li>
            <Clock className={styles.ruleIcon} />
            <span>Time bonus: Solve quickly for extra points</span>
          </li>
          <li>
            <Zap className={styles.ruleIcon} />
            <span>Build your multiplier with consecutive correct guesses</span>
          </li>
        </ul>
      </div>
      <Button onClick={handleStartGame} className={styles.startButton} disabled={isLoading}>
        {isLoading ? "Initializing..." : "Start Game"}
      </Button>
    </div>
  )
}

