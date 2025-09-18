import { type NextRequest, NextResponse } from "next/server"
import { storage } from "@/server/storage"

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { quantity } = await req.json()
    const updated = await storage.updateCartItem(params.id, quantity)
    if (!updated) {
      return NextResponse.json({ message: "Cart item not found" }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ message: "Failed to update cart item" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const ok = await storage.removeFromCart(params.id)
    if (!ok) {
      return NextResponse.json({ message: "Cart item not found" }, { status: 404 })
    }
    return NextResponse.json({ message: "Item removed from cart" })
  } catch {
    return NextResponse.json({ message: "Failed to remove cart item" }, { status: 500 })
  }
}
