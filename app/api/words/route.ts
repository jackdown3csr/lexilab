import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function DELETE() {
  try {
    await kv.del("words")
    return NextResponse.json({ message: "All words deleted successfully" })
  } catch (error) {
    console.error("Error deleting words:", error)
    return NextResponse.json({ error: "Failed to delete words" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { word, hint } = await request.json()
    if (!word || !hint) {
      return NextResponse.json({ error: "Word and hint are required" }, { status: 400 })
    }

    const words = ((await kv.get("words")) as [string, string][]) || []
    words.push([word, hint])
    await kv.set("words", words)

    return NextResponse.json({ message: "Word added successfully" })
  } catch (error) {
    console.error("Error adding word:", error)
    return NextResponse.json({ error: "Failed to add word" }, { status: 500 })
  }
}

