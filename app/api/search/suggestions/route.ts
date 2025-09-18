import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"
import { generateSearchSuggestions } from "@/server/services/gemini"

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get("q")
    if (!q) return NextResponse.json([])

    const products = await storage.getProducts()
    const suggestions = await generateSearchSuggestions(q, products)
    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json({ message: "Failed to generate search suggestions" }, { status: 500 })
  }
}
