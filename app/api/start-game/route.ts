import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function POST() {
  try {
    const words = (await kv.get("words")) as [string, string][]
    if (!words || words.length === 0) {
      return NextResponse.json({ error: "No words available" }, { status: 500 })
    }

    const [word, hint] = words[Math.floor(Math.random() * words.length)]
    const gameId = Math.random().toString(36).substring(2, 15)

    const initialState = {
      currentWord: word.toUpperCase(),
      currentHint: hint,
      attempts: 10,
      score: 0,
      usedLetters: [],
      correctLetters: [],
      multiplier: 1,
      wordsCompleted: 0,
    }

    await kv.set(`game:${gameId}`, initialState, { ex: 86400 }) // Expire in 24 hours

    return NextResponse.json({
      gameId,
      initialState,
      dbInteractions: 1, // Assuming this is the first interaction
    })
  } catch (error) {
    console.error("Error starting game:", error)
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

