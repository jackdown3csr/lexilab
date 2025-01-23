import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function GET() {
  try {
    const words = await kv.get("words")
    if (!words || !Array.isArray(words)) {
      return NextResponse.json({ count: 0 })
    }
    return NextResponse.json({ count: words.length })
  } catch (error) {
    console.error("Error fetching word count:", error)
    return NextResponse.json({ error: "Failed to fetch word count" }, { status: 500 })
  }
}

