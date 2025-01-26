import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function POST() {
  try {
    await kv.del("highscores")
    return NextResponse.json({ message: "High scores wiped successfully" })
  } catch (error) {
    console.error("Error wiping high scores:", error)
    return NextResponse.json({ error: "Failed to wipe high scores" }, { status: 500 })
  }
}

