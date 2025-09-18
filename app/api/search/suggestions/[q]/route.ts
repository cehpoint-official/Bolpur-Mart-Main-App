import { NextResponse } from "next/server"
import { storage } from "@/server/storage"
import { generateSearchSuggestions } from "@/server/services/gemini"

export async function GET(_req: Request, { params }: { params: { q: string } }) {
  try {
    if (!params.q) return NextResponse.json([])
    const products = await storage.getProducts()
    const suggestions = await generateSearchSuggestions(params.q, products)
    return NextResponse.json(suggestions)
  } catch {
    return NextResponse.json({ message: "Failed to generate search suggestions" }, { status: 500 })
  }
}
