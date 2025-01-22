import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface HighScore {
  member: string
  score: number
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

  try {
    console.log("Fetching high scores from KV store...")
    const highScores = await kv.zrange("highscores", 0, -1, { rev: true, withScores: true })
    console.log("Received high scores:", JSON.stringify(highScores))

    if (!highScores || highScores.length === 0) {
      console.log("No high scores found in the KV store")
      return NextResponse.json({ topScores: [], totalScores: 0 }, { status: 200 })
    }

    if (!Array.isArray(highScores)) {
      console.error("Invalid data format received from KV store:", highScores)
      return NextResponse.json({ error: "Invalid data format received from KV store" }, { status: 500 })
    }

    const formattedScores: HighScore[] = []
    for (let i = 0; i < highScores.length; i += 2) {
      const member = highScores[i]
      const score = highScores[i + 1]
      if (typeof member === "string" && typeof score === "number") {
        formattedScores.push({ member: member.toUpperCase(), score })
      } else {
        console.warn(`Skipping invalid score data: ${member}, ${score}`)
      }
    }

    const topScores = formattedScores.slice(0, limit)
    const totalScores = formattedScores.length

    console.log("Formatted scores:", { topScores, totalScores })
    return NextResponse.json({ topScores, totalScores })
  } catch (error) {
    console.error("Error fetching high scores:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch high scores",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, score } = body

    console.log("Received POST request with body:", JSON.stringify(body))

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Invalid name provided" }, { status: 400 })
    }

    const uppercaseName = name.trim().toUpperCase()

    if (score === undefined || typeof score !== "number" || isNaN(score)) {
      return NextResponse.json({ error: "Invalid score provided" }, { status: 400 })
    }

    // Check if the player already has a score
    const existingScore = await kv.zscore("highscores", uppercaseName)

    if (existingScore !== null) {
      if (score <= existingScore) {
        return NextResponse.json(
          {
            message: "Existing score is higher or equal",
            existingScore: existingScore,
          },
          { status: 200 },
        )
      }
    }

    console.log(`Adding/updating high score: ${uppercaseName} - ${score}`)
    await kv.zadd("highscores", { score: score, member: uppercaseName })

    console.log("Fetching updated high scores...")
    const updatedHighScores = await kv.zrange("highscores", 0, -1, { rev: true, withScores: true })
    console.log("Raw updated high scores:", JSON.stringify(updatedHighScores))

    if (!updatedHighScores || !Array.isArray(updatedHighScores)) {
      console.error("Invalid data received from KV store after adding new score:", updatedHighScores)
      return NextResponse.json({ error: "Failed to retrieve updated high scores" }, { status: 500 })
    }

    const formattedScores: HighScore[] = []
    for (let i = 0; i < updatedHighScores.length; i += 2) {
      const member = updatedHighScores[i]
      const score = updatedHighScores[i + 1]
      if (typeof member === "string" && typeof score === "number") {
        formattedScores.push({ member, score })
      } else {
        console.warn(`Skipping invalid score data: ${member}, ${score}`)
      }
    }

    const userRank = formattedScores.findIndex((s) => s.member === uppercaseName) + 1
    const topScores = formattedScores.slice(0, 5)
    const totalScores = formattedScores.length

    console.log("Formatted updated high scores:", { topScores, totalScores, userRank })
    return NextResponse.json({
      message: "High score added/updated successfully",
      topScores,
      totalScores,
      userRank,
    })
  } catch (error) {
    console.error("Error saving high score:", error)
    return NextResponse.json(
      {
        error: "Failed to save high score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

