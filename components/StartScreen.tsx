import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Shield, Clock, Star, Zap, Heart } from "lucide-react"
import styles from "@/styles/StartScreen.module.css"
import { setAutoplayAllowed, playBackgroundMusic, initializeSounds } from "@/utils/sounds"
import Modal from "@/components/Modal"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface StartScreenProps {
  onStartGame: () => Promise<void>
  isTargetedResolution: boolean
  isMobileViewportAdjusted: boolean
}

export default function StartScreen({ onStartGame, isTargetedResolution, isMobileViewportAdjusted }: StartScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [revealedLetters, setRevealedLetters] = useState<string[]>([])
  const fullTitle = "LEXILAB"
  const [wordCount, setWordCount] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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
      } catch {
        //Removed: console.error("Error fetching word count:", error)
      }
    }
    fetchWordCount()
  }, [])

  useEffect(() => {
    const initSound = async () => {
      await initializeSounds()
      setAutoplayAllowed(true)
    }
    initSound()
  }, [])

  const handleStartGame = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      await initializeSounds()
      setAutoplayAllowed(true)
      await playBackgroundMusic()
      await onStartGame()
    } catch {
      //Removed: console.error("Error starting game:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className={`${styles.startScreen} ${isTargetedResolution ? styles.targetedResolution : ""} ${isMobileViewportAdjusted ? styles.mobileViewportAdjusted : ""}`}
    >
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
          <h3 className={styles.rulesTitle} onClick={() => setIsModalOpen(true)}>
            Game Rules
          </h3>
          <ul className={styles.rulesList}>
            <li>
              <Shield className={styles.ruleIcon} />
              <span>Crack the code: Guess hidden words from cryptic clues</span>
            </li>
            <li>
              <Heart className={styles.ruleIcon} />
              <span>10 lives to start, bonus life every 5 levels</span>
            </li>
            <li>
              <Star className={styles.ruleIcon} />
              <span>Rack up points: Correct guesses boost your score</span>
            </li>
            <li>
              <Clock className={styles.ruleIcon} />
              <span>Beat the clock: Higher multipliers in first 60 seconds</span>
            </li>
            <li>
              <Zap className={styles.ruleIcon} />
              <span>Chain reactions: Consecutive wins amplify your multiplier</span>
            </li>
          </ul>
        </div>
        <Button onClick={handleStartGame} className={styles.startButton} disabled={isLoading}>
          {isLoading ? "Initializing..." : "Start Game"}
        </Button>
        {wordCount !== null && <p className={styles.wordCount}>Words in database: {wordCount}</p>}
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Game Information">
        <Tabs defaultValue="rules" className={styles.tabs}>
          <TabsList className={styles.tabsList}>
            <TabsTrigger value="rules" className={styles.tabsTrigger}>
              Game Rules
            </TabsTrigger>
            <TabsTrigger value="multiplier" className={styles.tabsTrigger}>
              Multiplier Calculation
            </TabsTrigger>
          </TabsList>
          <TabsContent value="rules" className={styles.tabsContent}>
            <h2>Full Game Mechanics</h2>
            <ul>
              <li>Start with 10 lives and try to guess as many words as possible.</li>
              <li>Each correct letter guess increases your score and multiplier.</li>
              <li>Incorrect guesses cost you a life.</li>
              <li>Complete words to move to the next level and earn bonus points.</li>
              <li>Every 5 levels, you earn a bonus life.</li>
              <li>The game ends when you run out of lives or time.</li>
              <li>Time bonus: Higher score multiplier during the first 60 seconds of each level.</li>
              <li>Consecutive correct guesses increase your multiplier further.</li>
              <li>Word complexity affects your score: longer and more unique words give higher points.</li>
              <li>Aim for the highest score and compete on the leaderboard!</li>
            </ul>
          </TabsContent>
          <TabsContent value="multiplier" className={styles.tabsContent}>
            <h2>Multiplier Calculation</h2>
            <p>Your score multiplier is calculated based on several factors:</p>
            <ul>
              <li>Base Multiplier: Starts at 1.02 and increases with consecutive correct guesses (max 1.75)</li>
              <li>Time Multiplier: 1.75x for the first 60 seconds of each level, then decreases to 1x</li>
              <li>Word Complexity: Ranges from 1.2x to 1.9x based on word length and unique letters</li>
            </ul>
            <p>Final Multiplier = Base Multiplier × Time Multiplier × Word Complexity</p>
            <p>The multiplier resets to the base value at the start of each new word.</p>
          </TabsContent>
        </Tabs>
      </Modal>
    </div>
  )
}

