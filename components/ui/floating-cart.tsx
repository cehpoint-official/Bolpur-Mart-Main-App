"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"

interface FloatingCartProps {
  userId: string
  onOpenCart: () => void
}

export function FloatingCart({ userId, onOpenCart }: FloatingCartProps) {
  const { cartSummary } = useCart(userId)

  if (cartSummary.itemCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-md mx-auto" data-testid="floating-cart">
      <Button
        onClick={onOpenCart}
        className="floating-btn w-full bg-primary text-primary-foreground py-4 rounded-2xl flex items-center justify-between px-6 h-auto shadow-lg hover:shadow-xl transition-shadow"
        data-testid="view-cart-button"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-foreground text-primary rounded-full flex items-center justify-center font-bold">
            <span data-testid="cart-item-count">{cartSummary.itemCount}</span>
          </div>
          <span className="font-semibold">View Cart</span>
        </div>
        <div className="text-right">
          <div className="font-bold" data-testid="cart-total">
            ₹{cartSummary.total.toFixed(0)}
          </div>
          <div className="text-xs opacity-80">Plus taxes</div>
        </div>
      </Button>
    </div>
  )
}
