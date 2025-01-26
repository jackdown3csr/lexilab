import { NextResponse } from "next/server"
import type { NextApiRequest, NextApiResponse } from "next"
import { kv } from "@vercel/kv"
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit"

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
}) as RateLimitRequestHandler

export async function GET(request: Request) {
  try {
    // Apply rate limiting with proper types
    await new Promise<void>((resolve, reject) => {
      limiter(
        request as unknown as NextApiRequest,
        {
          status: (statusCode: number) => ({ json: () => NextResponse.json({}, { status: statusCode }) }),
        } as unknown as NextApiResponse,
        (result: Error | undefined) => {
          if (result instanceof Error) {
            return reject(result)
          }
          resolve()
        },
      )
    })

    const words = await kv.get("words")
    if (!words || !Array.isArray(words) || words.length === 0) {
      console.error("Words not found or invalid in KV store")
      return NextResponse.json({ error: "Words not found or invalid" }, { status: 404 })
    }
    return NextResponse.json(words)
  } catch (error: unknown) {
    console.error("Error fetching words:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: "Internal Server Error", details: errorMessage }, { status: 500 })
  }
}

