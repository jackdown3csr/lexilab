import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface GameState {
  currentWord: string
  currentHint: string
  usedLetters: string[]
  correctLetters: string[]
  usedWords: string[]
  // Add other properties as needed
}

export async function POST(request: Request) {
  try {
    const { gameId, usedWords } = await request.json()

    if (!gameId) {
      return NextResponse.json({ error: "Game ID is required" }, { status: 400 })
    }

    const words = (await kv.get("words")) as [string, string][]
    if (!words || words.length === 0) {
      return NextResponse.json({ error: "No words available" }, { status: 500 })
    }

    // Filter out used words
    const availableWords = words.filter(([word]) => !usedWords.includes(word.toUpperCase()))

    if (availableWords.length === 0) {
      return NextResponse.json({ error: "All words have been used" }, { status: 400 })
    }

    const [word, hint] = availableWords[Math.floor(Math.random() * availableWords.length)]

    if (!word || !hint) {
      return NextResponse.json({ error: "Invalid word data" }, { status: 500 })
    }

    const gameState = (await kv.get(`game:${gameId}`)) as GameState | null
    if (!gameState) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const updatedGameState: GameState = {
      ...gameState,
      currentWord: word.toUpperCase(),
      currentHint: hint,
      usedLetters: [],
      correctLetters: [],
      usedWords: [...(gameState.usedWords || []), word.toUpperCase()],
    }

    await kv.set(`game:${gameId}`, updatedGameState, { ex: 3600 }) // Refresh expiration

    return NextResponse.json({ word, hint })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

