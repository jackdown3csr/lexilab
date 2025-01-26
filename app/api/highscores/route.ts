import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface GameSummary {
  score: number
  // Add other properties as needed
}

interface HighScore {
  member: string
  score: number
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)
    const name = searchParams.get("name")

    if (name) {
      const score = await kv.zscore("leaderboard", name.toUpperCase())
      if (score !== null) {
        return NextResponse.json({ score })
      } else {
        return NextResponse.json({ score: null })
      }
    }

    const highScores = await kv.zrange("leaderboard", 0, limit - 1, { rev: true, withScores: true })

    if (!highScores || !Array.isArray(highScores)) {
      return NextResponse.json({ error: "Failed to retrieve high scores" }, { status: 500 })
    }

    const formattedScores: HighScore[] = []
    for (let i = 0; i < highScores.length; i += 2) {
      const member = highScores[i]
      const score = highScores[i + 1]
      if (typeof member === "string" && typeof score === "number") {
        formattedScores.push({ member, score })
      }
    }

    return NextResponse.json({ topScores: formattedScores })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to retrieve high scores", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, score, gameId } = body

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Invalid name provided" }, { status: 400 })
    }

    const uppercaseName = name.trim().toUpperCase()

    if (score === undefined || typeof score !== "number" || isNaN(score)) {
      return NextResponse.json({ error: "Invalid score provided" }, { status: 400 })
    }

    const gameSummary = (await kv.get(`summary:${gameId}`)) as GameSummary | null

    if (!gameSummary || gameSummary.score !== score) {
      return NextResponse.json({ error: "Invalid score or game not found" }, { status: 400 })
    }

    const existingScore = await kv.zscore("leaderboard", uppercaseName)
    if (existingScore !== null && existingScore >= score) {
      return NextResponse.json({ error: "Existing score is higher or equal", existingScore }, { status: 400 })
    }

    await kv.zadd("leaderboard", { score: score, member: uppercaseName })

    const updatedHighScores = await kv.zrange("leaderboard", 0, -1, { rev: true, withScores: true })

    if (!updatedHighScores || !Array.isArray(updatedHighScores)) {
      return NextResponse.json({ error: "Failed to retrieve updated high scores" }, { status: 500 })
    }

    const formattedScores: HighScore[] = []
    for (let i = 0; i < updatedHighScores.length; i += 2) {
      const member = updatedHighScores[i]
      const score = updatedHighScores[i + 1]
      if (typeof member === "string" && typeof score === "number") {
        formattedScores.push({ member, score })
      }
    }

    const userRank = formattedScores.findIndex((s) => s.member === uppercaseName) + 1
    const topScores = formattedScores.slice(0, 5)
    const totalScores = formattedScores.length

    await kv.del(`summary:${gameId}`)

    return NextResponse.json({
      message: "High score added to leaderboard successfully",
      topScores,
      totalScores,
      userRank,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to save high score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

