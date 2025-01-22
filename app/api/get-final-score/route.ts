import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface GameState {
  score: number
  wordsCompleted: number
  attempts: number
}

export async function POST(request: Request) {
  try {
    const { gameId, currentScore } = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const gameState = (await kv.get(`game:${gameId}`)) as GameState | null
    if (!gameState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const { score, wordsCompleted, attempts } = gameState
    const isGameOver = attempts <= 0

    // Use the higher of the two scores (server-side or client-side)
    const finalScore = Math.max(Math.round(score), currentScore)

    // If the game is over, delete the game state
    if (isGameOver) {
      await kv.del(`game:${gameId}`)
    }

    return NextResponse.json({ finalScore, wordsCompleted, isGameOver })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

