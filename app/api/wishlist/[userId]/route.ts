import { NextResponse } from "next/server"
import { storage } from "@/server/storage"

export async function GET(_req: Request, { params }: { params: { userId: string } }) {
  try {
    const wishlist = await storage.getWishlist(params.userId)
    const itemsWithProducts = await Promise.all(
      wishlist.map(async (item) => {
        const product = await storage.getProduct(item.productId!)
        return { ...item, product }
      }),
    )
    return NextResponse.json(itemsWithProducts)
  } catch {
    return NextResponse.json({ message: "Failed to fetch wishlist" }, { status: 500 })
  }
}
