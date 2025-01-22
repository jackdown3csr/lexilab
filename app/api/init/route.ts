import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function GET() {
  try {
    const words = await kv.get("words")

    if (!words || !Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ message: "Words not found. Please populate words." }, { status: 404 })
    }

    return NextResponse.json({ message: "Application initialized successfully" })
  } catch (error) {
    console.error("Error initializing application:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize application",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

