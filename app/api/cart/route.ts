import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/lib/storage"
import { insertCartSchema } from "@/shared/schema" // fix schema import path to local shared module
import { z } from "zod"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    
    if (!userId) {
      return NextResponse.json(
        { error: "Missing required parameter: userId" },
        { status: 400 }
      )
    }

    const cartItems = await storage.getCartItems(userId)
    return NextResponse.json(cartItems)
  } catch (error) {
    console.error("Error fetching cart items:", error)
    return NextResponse.json(
      { error: "Failed to fetch cart items" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validated = insertCartSchema.parse(body)
    const item = await storage.addToCart(validated)
    return NextResponse.json(item)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid cart item data", errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ message: "Failed to add item to cart" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const productId = searchParams.get("productId")
    
    if (!userId || !productId) {
      return NextResponse.json(
        { error: "Missing required parameters: userId and productId" },
        { status: 400 }
      )
    }

    await storage.removeFromCart(userId, productId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing item from cart:", error)
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    )
  }
}
