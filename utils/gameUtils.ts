import { kv } from "@vercel/kv"
import { gameSettings } from "./gameSettings"

interface GameState {
  currentWord: string
  currentHint: string
  attempts: number
  score: number
  usedLetters: string[]
  correctLetters: string[]
  multiplier: number
  wordsCompleted: number
}

export async function startGame() {
  try {
    const words = (await kv.get("words")) as [string, string][]
    if (!words || words.length === 0) {
      throw new Error("No words available in the database")
    }

    const [word, hint] = words[Math.floor(Math.random() * words.length)]
    const gameId = Math.random().toString(36).substring(2, 15)

    const initialState = {
      currentWord: word.toUpperCase(),
      currentHint: hint,
      attempts: gameSettings.initialAttempts,
      score: 0,
      usedLetters: [],
      correctLetters: [],
      multiplier: gameSettings.initialBaseMultiplier,
      wordsCompleted: 0,
    }

    await kv.set(`game:${gameId}`, initialState, { ex: 3600 }) // Expire in 1 hour

    return {
      gameId,
      initialState,
      dbInteractions: 1, // Initial DB interaction for starting the game
    }
  } catch (error) {
    throw new Error(`Failed to start game: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getFinalScore(gameId: string) {
  try {
    const gameState = (await kv.get(`game:${gameId}`)) as GameState | null
    if (!gameState) {
      throw new Error("Game not found")
    }
    return gameState.score
  } catch (error) {
    throw error
  }
}

export async function submitGameSummary(gameSummary: {
  gameId: string
  score: number
  wordsCompleted: number
  totalCorrectGuesses: number
  timeTaken: number
}) {
  try {
    const response = await fetch("/api/submit-game-summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(gameSummary),
    })
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || "Failed to submit game summary")
    }
    const data = await response.json()
    return data
  } catch (error) {
    throw error
  }
}

