import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Clock, Star, Zap, Heart } from "lucide-react"
import styles from "@/styles/StartScreen.module.css"

interface StartScreenProps {
  onStartGame: () => Promise<void>
  isTargetedResolution: boolean
}

export default function StartScreen({ onStartGame, isTargetedResolution }: StartScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [revealedLetters, setRevealedLetters] = useState<string[]>([])
  const fullTitle = "LEXILAB"
  const [wordCount, setWordCount] = useState<number | null>(null)

  useEffect(() => {
    const revealNextLetter = (index: number) => {
      if (index < fullTitle.length) {
        setRevealedLetters((prev) => [...prev, fullTitle[index]])
        setTimeout(() => revealNextLetter(index + 1), 200)
      }
    }
    revealNextLetter(0)
  }, [])

  useEffect(() => {
    const fetchWordCount = async () => {
      try {
        const response = await fetch("/api/word-count")
        if (response.ok) {
          const data = await response.json()
          setWordCount(data.count)
        }
      } catch (error) {
        console.error("Error fetching word count:", error)
      }
    }
    fetchWordCount()
  }, [])

  const handleStartGame = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await onStartGame()
    } catch (error) {
      console.error("Error starting game:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`${styles.startScreen} ${isTargetedResolution ? styles.targetedResolution : ""}`}>
      <div className={styles.content}>
        <div className={styles.gameTitleContainer}>
          <h1 className={styles.gameTitle}>
            {fullTitle.split("").map((letter, index) => (
              <span
                key={index}
                className={`${styles.titleLetter} ${revealedLetters.includes(letter) ? styles.revealed : ""}`}
              >
                {letter}
              </span>
            ))}
          </h1>
        </div>
        <div className={styles.authors}>
          <span>BY </span>
          <span className={styles.authorName}>JACKDOWN3CSR</span>
          <span> & </span>
          <span className={styles.authorName}>ADDICTION</span>
        </div>
        <p className={styles.description}>
          Challenge your vocabulary and deduction skills in this thrilling word-guessing adventure. Decrypt hidden
          words, race against time, and aim for the highest score!
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
              <span>Start with 10 lives, earn a bonus life every 3 levels</span>
            </li>
            <li>
              <Star className={styles.ruleIcon} />
              <span>Score points for correct guesses and completed words</span>
            </li>
            <li>
              <Clock className={styles.ruleIcon} />
              <span>Higher score multiplier during the first 60 seconds of each level</span>
            </li>
            <li>
              <Zap className={styles.ruleIcon} />
              <span>Increase your multiplier with consecutive correct guesses and word complexity</span>
            </li>
          </ul>
        </div>
        <Button onClick={handleStartGame} className={styles.startButton} disabled={isLoading}>
          {isLoading ? "Initializing..." : "Start Game"}
        </Button>
        {wordCount !== null && <p className={styles.wordCount}>Words in database: {wordCount}</p>}
      </div>
    </div>
  )
}

