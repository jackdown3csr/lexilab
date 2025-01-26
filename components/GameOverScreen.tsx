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
  isTargetedResolution: boolean
  isMobileViewportAdjusted: boolean
  gameId: string
}

export default function GameOverScreen({
  score,
  onPlayAgain,
  isTargetedResolution,
  isMobileViewportAdjusted,
  gameId,
}: GameOverScreenProps) {
  const [playerName, setPlayerName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)
  const [highScores, setHighScores] = useState<HighScore[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [existingHighScore, setExistingHighScore] = useState<number | null>(null)

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
      console.error("Error fetching high scores:", error) //This line was to be removed, but it's already removed in the original code.
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
        body: JSON.stringify({ name: playerName, score: Math.round(score), gameId }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === "Existing score is higher or equal") {
          setExistingHighScore(data.existingScore)
        } else {
          throw new Error(data.error || "Failed to save score")
        }
      } else {
        setHighScores(data.topScores)
        setUserRank(data.userRank)
        setSavedSuccessfully(true)
      }
    } catch (error) {
      console.error("Error saving score:", error)
      setSaveError(error instanceof Error ? error.message : "An unknown error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  const truncateName = (name: string, maxLength = 22) => {
    return name.length > maxLength ? name.substring(0, maxLength - 3) + "..." : name
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div
      className={`${styles.gameOverScreen} ${isTargetedResolution ? styles.targetedResolution : ""} ${
        isMobileViewportAdjusted ? styles.mobileViewportAdjusted : ""
      }`}
    >
      <h2 className={styles.title}>Game Over</h2>
      <p className={styles.score}>Your Score: {Math.round(score)}</p>
      <div className={styles.saveScoreSection}>
        {!savedSuccessfully && existingHighScore === null && (
          <div className={styles.saveScore}>
            <Input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
              placeholder="Enter your name"
              disabled={isSaving}
              maxLength={22}
              className={`${styles.input} ${styles.orbitronFont}`}
            />
            <Button onClick={handleSaveScore} disabled={isSaving} className={`${styles.button} ${styles.orbitronFont}`}>
              {isSaving ? "Saving..." : "Save Score"}
            </Button>
          </div>
        )}
        {saveError && <p className={styles.error}>{saveError}</p>}
        {savedSuccessfully && <p className={styles.saved}>Score saved successfully!</p>}
        {existingHighScore !== null && (
          <p className={styles.existingScore}>
            Your current high score ({existingHighScore}) is higher. Keep playing to beat it!
          </p>
        )}
      </div>
      {userRank && <p className={styles.rank}>Your Rank: {userRank}</p>}
      <div className={styles.leaderboardContainer}>
        <div className={styles.leaderboard}>
          <h3>Top 5 High Scores</h3>
          {highScores.length > 0 ? (
            <div className={styles.tableWrapper}>
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
                      <td>{truncateName(score.member)}</td>
                      <td>{score.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.noScores}>No high scores available yet.</p>
          )}
        </div>
      </div>
      <Button onClick={onPlayAgain} className={`${styles.playAgain} ${styles.button} ${styles.orbitronFont}`}>
        Play Again
      </Button>
    </div>
  )
}

