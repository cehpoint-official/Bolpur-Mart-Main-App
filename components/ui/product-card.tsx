"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Heart, Plus, Minus } from "lucide-react"
import { getOptimizedImageUrl, getPlaceholderUrl } from "@/lib/cloudinary-config"
import { useCart } from "@/hooks/use-cart"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
  userId: string
}

export function ProductCard({ product, userId }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)

  const { addToCart, updateQuantity, getCartItemQuantity, cartItems, isAddingToCart } = useCart(userId)

  const quantity = getCartItemQuantity(product.id)
  const cartItem = cartItems.find((item) => item.productId === product.id)

  const originalPrice = Number.parseFloat(product.price)
  const discountedPrice = product.discountedPrice ? Number.parseFloat(product.discountedPrice) : null
  const discount = discountedPrice ? Math.round(((originalPrice - discountedPrice) / originalPrice) * 100) : 0

  const handleAddToCart = () => {
    addToCart(product.id, 1)
  }

  const handleIncreaseQuantity = () => {
    if (cartItem) {
      updateQuantity(cartItem.id, quantity + 1)
    } else {
      addToCart(product.id, 1)
    }
  }

  const handleDecreaseQuantity = () => {
    if (cartItem && quantity > 0) {
      updateQuantity(cartItem.id, quantity - 1)
    }
  }

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted)
    // TODO: Implement wishlist API call
  }

  const productImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ""
  const optimizedImageUrl = productImage ? getOptimizedImageUrl(productImage) : getPlaceholderUrl(400, 250)

  return (
    <Card
      className="product-card overflow-hidden border border-border shadow-sm"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative">
        <img
          src={imageLoaded ? optimizedImageUrl : getPlaceholderUrl(400, 250)}
          alt={product.name}
          className="w-full h-32 object-cover"
          onLoad={() => setImageLoaded(true)}
          data-testid={`product-image-${product.id}`}
        />

        {discount > 0 && (
          <Badge
            className="absolute top-2 left-2 bg-destructive text-destructive-foreground"
            data-testid={`product-discount-${product.id}`}
          >
            {discount}% OFF
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 w-8 h-8 bg-white/80 rounded-full"
          onClick={toggleWishlist}
          data-testid={`wishlist-button-${product.id}`}
        >
          <Heart className={`h-4 w-4 ${isWishlisted ? "text-red-500 fill-current" : "text-muted-foreground"}`} />
        </Button>
      </div>

      <CardContent className="p-3">
        <h3 className="font-medium mb-1" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>

        <p className="text-sm text-muted-foreground mb-2" data-testid={`product-description-${product.id}`}>
          {product.description}
        </p>

        <div className="flex items-center mb-2">
          <div className="flex text-yellow-400 text-xs">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < Math.floor(Number.parseFloat(product.rating || "0")) ? "fill-current" : "fill-none"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground ml-1" data-testid={`product-rating-${product.id}`}>
            ({product.rating}) • {product.reviewCount} reviews
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-primary" data-testid={`product-price-${product.id}`}>
              ₹{discountedPrice || originalPrice}
            </span>
            {discountedPrice && (
              <span className="text-sm text-muted-foreground line-through ml-1">₹{originalPrice}</span>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {quantity > 0 ? (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-8 h-8 bg-transparent"
                  onClick={handleDecreaseQuantity}
                  data-testid={`decrease-quantity-${product.id}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span className="w-8 text-center font-medium" data-testid={`product-quantity-${product.id}`}>
                  {quantity}
                </span>

                <Button
                  variant="default"
                  size="icon"
                  className="w-8 h-8"
                  onClick={handleIncreaseQuantity}
                  disabled={isAddingToCart}
                  data-testid={`increase-quantity-${product.id}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="icon"
                className="w-8 h-8"
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                data-testid={`add-to-cart-${product.id}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
