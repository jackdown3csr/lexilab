"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import styles from "@/styles/GameOverScreen.module.css"
import LoadingScreen from "@/components/LoadingScreen"

interface HighScore {
  member: string
  score: number
}

interface GameOverScreenProps {
  score: number
  onPlayAgain: () => void
}

export default function GameOverScreen({ score, onPlayAgain }: GameOverScreenProps) {
  const [playerName, setPlayerName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)
  const [highScores, setHighScores] = useState<HighScore[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [existingScore, setExistingScore] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchHighScores()
  }, [])

  const fetchHighScores = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/highscores?limit=5")
      if (!response.ok) {
        throw new Error("Failed to fetch high scores")
      }
      const data = await response.json()
      setHighScores(data.topScores)
    } catch (error) {
      console.error("Error fetching high scores:", error)
      setSaveError("Failed to fetch high scores. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveScore = async () => {
    if (!playerName.trim()) {
      setSaveError("Please enter your name")
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch("/api/highscores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: playerName, score }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to save score")
      }

      if (data.message === "Existing score is higher or equal") {
        setExistingScore(data.existingScore)
      } else {
        setHighScores(data.topScores)
        setUserRank(data.userRank)
        setSavedSuccessfully(true)
      }
    } catch {
      setSaveError("Failed to save score. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className={styles.gameOverScreen}>
      <h2 className={styles.title}>Game Over</h2>
      <p className={styles.score}>Your Score: {score}</p>
      <div className={styles.saveScoreSection}>
        {!savedSuccessfully && !existingScore && (
          <div className={styles.saveScore}>
            <Input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              placeholder="Enter your name"
              disabled={isSaving}
            />
            <Button onClick={handleSaveScore} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Score"}
            </Button>
          </div>
        )}
        {saveError && <p className={styles.error}>{saveError}</p>}
        {savedSuccessfully && <p className={styles.saved}>Score saved successfully!</p>}
        {existingScore !== null && (
          <p className={styles.existingScore}>
            You already have a higher score of {existingScore}. Keep playing to beat your best!
          </p>
        )}
      </div>
      {userRank && <p className={styles.rank}>Your Rank: {userRank}</p>}
      <div className={styles.leaderboard}>
        <h3>Top 5 High Scores</h3>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {highScores.map((score, index) => (
              <tr key={index} className={userRank === index + 1 ? styles.userScore : ""}>
                <td>{index + 1}</td>
                <td>{score.member}</td>
                <td>{score.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={onPlayAgain} className={styles.playAgain}>
        Play Again
      </Button>
    </div>
  )
}

