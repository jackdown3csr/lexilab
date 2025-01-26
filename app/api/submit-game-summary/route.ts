import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface GameSummary {
  gameId: string
  score: number
  wordsCompleted: number
  totalCorrectGuesses: number
  timeTaken: number
}

export async function POST(request: Request) {
  try {
    const gameSummary: GameSummary = await request.json()
    console.log("Received game summary:", gameSummary)

    // Perform basic validation
    if (!gameSummary.gameId || typeof gameSummary.score !== "number" || gameSummary.score < 0) {
      return NextResponse.json({ error: "Invalid game summary" }, { status: 400 })
    }

    // Retrieve the original game state
    const originalGameState = await kv.get(`game:${gameSummary.gameId}`)
    if (!originalGameState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Simple score validation based on words completed
    const maxPossibleScore = Math.max(1000, gameSummary.wordsCompleted * 1000) // Allow up to 1000 points for incomplete first word
    if (gameSummary.score > maxPossibleScore) {
      return NextResponse.json({ error: "Suspicious score" }, { status: 400 })
    }

    // Store the validated game summary temporarily (1 hour expiration)
    await kv.set(`summary:${gameSummary.gameId}`, gameSummary, { ex: 3600 })

    console.log("Game summary stored successfully")

    return NextResponse.json({
      validatedScore: gameSummary.score,
      finalWordsCompleted: gameSummary.wordsCompleted,
    })
  } catch (error) {
    console.error("Error processing game summary:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

