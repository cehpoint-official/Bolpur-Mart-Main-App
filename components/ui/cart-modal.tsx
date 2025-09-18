"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { X, Plus, Minus } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { getOptimizedImageUrl, getPlaceholderUrl } from "@/lib/cloudinary-config"

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
  userId: string
}

export function CartModal({ isOpen, onClose, onCheckout, userId }: CartModalProps) {
  const { cartItems, cartSummary, updateQuantity, removeItem, isUpdating } = useCart(userId)

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    updateQuantity(cartItemId, newQuantity)
  }

  const handleCheckout = () => {
    onCheckout()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto h-[80vh] flex flex-col" data-testid="cart-modal">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Your Cart</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="close-cart"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🛒</span>
              </div>
              <h3 className="font-semibold mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground text-sm">Add some delicious items to get started!</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {cartItems.map((item) => {
                const product = item.product
                const price = parseFloat(product?.discountedPrice || product?.price || "0")
                const imageUrl = product?.images?.[0] 
                  ? getOptimizedImageUrl(product.images[0], { width: 80, height: 80, crop: "fill" })
                  : getPlaceholderUrl(80, 80)

                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 bg-card p-3 rounded-xl"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <img
                      src={imageUrl}
                      alt={product?.name || "Product"}
                      className="w-12 h-12 object-cover rounded-lg"
                      data-testid={`cart-item-image-${item.id}`}
                    />
                    
                    <div className="flex-1">
                      <h3 className="font-medium" data-testid={`cart-item-name-${item.id}`}>
                        {product?.name}
                      </h3>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant}
                        </p>
                      )}
                      <p className="font-semibold text-primary" data-testid={`cart-item-price-${item.id}`}>
                        ₹{price}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        disabled={isUpdating}
                        data-testid={`decrease-cart-quantity-${item.id}`}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="font-medium w-8 text-center" data-testid={`cart-item-quantity-${item.id}`}>
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="default"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={isUpdating}
                        data-testid={`increase-cart-quantity-${item.id}`}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bill Details */}
            <div className="flex-shrink-0 bg-muted/50 p-4 rounded-xl mb-4" data-testid="bill-details">
              <h3 className="font-semibold mb-3">Bill Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span data-testid="bill-subtotal">₹{cartSummary.subtotal.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Delivery Fee</span>
                  <span data-testid="bill-delivery-fee">
                    {cartSummary.deliveryFee === 0 ? "FREE" : `₹${cartSummary.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges</span>
                  <span data-testid="bill-taxes">₹{cartSummary.taxes}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span data-testid="bill-total">₹{cartSummary.total.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full py-4 text-lg font-bold"
              data-testid="proceed-to-checkout"
            >
              Proceed to Checkout
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
