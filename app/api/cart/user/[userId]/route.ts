import { NextResponse } from "next/server"
import { storage } from "@/server/storage"

export async function DELETE(_req: Request, { params }: { params: { userId: string } }) {
  try {
    await storage.clearCart(params.userId)
    return NextResponse.json({ message: "Cart cleared" })
  } catch {
    return NextResponse.json({ message: "Failed to clear cart" }, { status: 500 })
  }
}

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  try {
    const cartItems = await storage.getCartItems(params.userId)
    const itemsWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await storage.getProduct(item.productId!)
        return { ...item, product }
      }),
    )
    return NextResponse.json(itemsWithProducts)
  } catch {
    return NextResponse.json({ message: "Failed to fetch cart items" }, { status: 500 })
  }
}
