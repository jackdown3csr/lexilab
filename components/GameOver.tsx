import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import styles from "@/styles/GameOver.module.css"

interface GameOverProps {
  score: number
  onPlayAgain: () => void
}

export default function GameOver({ score, onPlayAgain }: GameOverProps) {
  const [playerName, setPlayerName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedSuccessfully, setSavedSuccessfully] = useState(false)

  const handleSaveScore = async () => {
    if (!playerName.trim()) {
      setSaveError("Please enter your name")
      return
    }

    setIsSaving(true)
    setSaveError(null)

    try {
      const response = await fetch("/api/save-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: playerName, score }),
      })

      if (!response.ok) {
        throw new Error("Failed to save score")
      }

      setSavedSuccessfully(true)
    } catch {
      setSaveError("Failed to save score. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className={styles.gameOverContainer}>
      <h1 className={styles.title}>Game Over</h1>
      <p className={styles.score}>Your Score: {score}</p>
      {!savedSuccessfully && (
        <div className={styles.saveScore}>
          <Input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            disabled={isSaving}
          />
          <Button onClick={handleSaveScore} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Score"}
          </Button>
          {saveError && <p className={styles.error}>{saveError}</p>}
        </div>
      )}
      {savedSuccessfully && <p className={styles.saved}>Score saved successfully!</p>}
      <Button onClick={onPlayAgain} className={styles.playAgain}>
        Play Again
      </Button>
    </div>
  )
}

