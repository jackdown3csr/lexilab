import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface DevOverlayProps {
  baseMultiplier: number
  timeMultiplier: number
  wordComplexityMultiplier: number
  score: number
  isGodMode: boolean
  currentWord: string
  currentHint: string
  totalAttempts: number
  level: number
  timeRemaining: number
  dbInteractions: number
  correctGuessesCount: number
  currentWordLength: number
  godModeThreshold: number
  freeLifeInterval: number
  consecutiveCorrectGuessesForExtraLife: number
  totalCorrectGuesses: number
  bonusLifeCorrectGuesses: number
  gameSettings?: { initialAttempts: number; baseLetterScore: number; wordCompletionBaseScore: number }
}

const DevOverlay: React.FC<DevOverlayProps> = ({
  baseMultiplier,
  timeMultiplier,
  wordComplexityMultiplier,
  score,
  isGodMode,
  currentWord,
  currentHint,
  totalAttempts,
  level,
  timeRemaining,
  dbInteractions,
  correctGuessesCount,
  currentWordLength,
  godModeThreshold,
  freeLifeInterval,
  consecutiveCorrectGuessesForExtraLife,
  totalCorrectGuesses,
  bonusLifeCorrectGuesses,
  gameSettings = { initialAttempts: 10, baseLetterScore: 1, wordCompletionBaseScore: 10 },
}) => {
  const [wipeStatus, setWipeStatus] = useState<string | null>(null)
  const totalMultiplier = baseMultiplier * timeMultiplier * wordComplexityMultiplier

  const handleWipeHighScores = async () => {
    try {
      const response = await fetch("/api/wipe-highscores", { method: "POST" })
      if (response.ok) {
        setWipeStatus("High scores wiped successfully")
        // Refresh the high scores after wiping
        const highScoresResponse = await fetch("/api/highscores?limit=5")
        if (highScoresResponse.ok) {
          await highScoresResponse.json()
        }
      } else {
        setWipeStatus("Failed to wipe high scores")
      }
    } catch (error) {
      console.error("Error wiping high scores:", error)
      setWipeStatus("Error wiping high scores")
    }
  }

  const refreshDevOverlay = () => {
    // You might need to implement a method in the parent component to refresh the game state
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        fontSize: "12px",
        zIndex: 9999,
        fontFamily: "monospace",
        maxHeight: "100vh",
        overflowY: "auto",
      }}
    >
      <h3>Game State</h3>
      <div>Current Word: {currentWord}</div>
      <div>Hint: {currentHint}</div>
      <div>Current Level: {level}</div>
      <div>Total Lives: {totalAttempts}</div>
      <div>Initial Lives: {gameSettings?.initialAttempts ?? 10}</div>
      <div>Extra Lives Earned: {Math.max(0, totalAttempts - (gameSettings?.initialAttempts ?? 10))}</div>
      <div>Time Remaining: {timeRemaining}s</div>
      <div>Score: {score}</div>
      <div>DB Interactions: {dbInteractions}</div>
      <div>Correct Guesses: {correctGuessesCount}/10</div>
      <div>Current Word Length: {currentWordLength}</div>
      <h3>Multipliers</h3>
      <div>Base Multiplier: {baseMultiplier.toFixed(3)}</div>
      <div>Time Multiplier: {timeMultiplier.toFixed(3)}</div>
      <div>Word Complexity: {wordComplexityMultiplier.toFixed(3)}</div>
      <div>Total Multiplier: {totalMultiplier.toFixed(3)}</div>
      <h3>Score Breakdown</h3>
      <div>Base Letter Score: {gameSettings.baseLetterScore}</div>
      <div>Word Completion Base Score: {gameSettings.wordCompletionBaseScore}</div>
      <div>
        Current Letter Score:{" "}
        {(gameSettings.baseLetterScore * baseMultiplier * timeMultiplier * wordComplexityMultiplier).toFixed(2)}
      </div>
      <div>
        Current Word Completion Score:{" "}
        {(gameSettings.wordCompletionBaseScore * baseMultiplier * timeMultiplier * wordComplexityMultiplier).toFixed(2)}
      </div>
      <h3>Game Mechanics</h3>
      <div>God Mode: {isGodMode ? "Active" : "Inactive"}</div>
      <div>God Mode Threshold: {godModeThreshold} correct guesses</div>
      <div>Free Life Interval: Every {freeLifeInterval} levels</div>
      <div>
        Consecutive Correct Guesses for Extra Life: {consecutiveCorrectGuessesForExtraLife}/{bonusLifeCorrectGuesses}
      </div>
      <div>
        Total Correct Guesses: {totalCorrectGuesses}/{godModeThreshold}
      </div>
      <Button
        onClick={refreshDevOverlay}
        variant="outline"
        size="sm"
        style={{ marginTop: "10px", marginRight: "10px" }}
      >
        Refresh Data
      </Button>
      <Button onClick={handleWipeHighScores} variant="destructive" size="sm" style={{ marginTop: "10px" }}>
        Wipe High Scores
      </Button>
      {wipeStatus && <div style={{ marginTop: "5px", color: "yellow" }}>{wipeStatus}</div>}
    </div>
  )
}

export default DevOverlay

