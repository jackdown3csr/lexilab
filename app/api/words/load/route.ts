import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import fs from "fs"
import path from "path"

export async function POST() {
  try {
    // Read the words.txt file
    const filePath = path.join(process.cwd(), "words.txt")
    const fileContent = fs.readFileSync(filePath, "utf-8")

    // Parse the file content
    const words = fileContent
      .split("\n")
      .map((line) => {
        const [word, hint] = line.split(",").map((item) => item.trim())
        return [word, hint]
      })
      .filter(([word, hint]) => word && hint) // Filter out any invalid entries

    // Delete existing words
    await kv.del("words")

    // Store the new words in KV
    await kv.set("words", words)

    return NextResponse.json({ message: "Words loaded successfully", count: words.length })
  } catch (error) {
    console.error("Error loading words:", error)
    return NextResponse.json({ error: "Failed to load words" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}

