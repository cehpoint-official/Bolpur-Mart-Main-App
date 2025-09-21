"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Heart, Plus, Minus, ShoppingBag, Clock, MapPin } from "lucide-react"
import { getOptimizedImageUrl, getPlaceholderUrl } from "@/lib/cloudinary-config"
import { useCart } from "@/hooks/use-cart"
import type { Product } from "@/types"
import Image from "next/image"

interface ProductCardProps {
  product: Product
  userId: string
}

export function ProductCard({ product, userId }: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [imageError, setImageError] = useState(false)

  const { addToCart, updateQuantity, getCartItemQuantity, cartItems, isAddingToCart } = useCart(userId)

  const quantity = getCartItemQuantity(product.id)
  const cartItem = cartItems.find((item) => item.productId === product.id)

  // Price calculations using correct field names
  const originalPrice = product.price
  const discountedPrice = product.discountedPrice || null
  const hasDiscount = product.hasDiscount
  const discountPercentage = product.discountPercentage || 0

  // Rating calculations
  const averageRating = product.averageRating || 0
  const totalRatings = product.totalRatings || 0
  const roundedRating = Math.round(averageRating * 10) / 10 // Round to 1 decimal place

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

  // Image handling - use imageUrl from product
  const productImage = product.imageUrl || ""
  const optimizedImageUrl = productImage && !imageError 
    ? getOptimizedImageUrl(productImage) 
    : getPlaceholderUrl(400, 250)

  // Format price display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('₹', '')
  }

  // Get vendor info (first vendor for display)
  const primaryVendor = product.vendors && product.vendors.length > 0 ? product.vendors[0] : null

  return (
    <Card
      className="product-card overflow-hidden border border-border shadow-sm hover:shadow-lg transition-all duration-300 bg-card"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative">
        {/* Product Image */}
        <div className="relative w-full h-32 bg-muted border-b">
          <Image
            src={optimizedImageUrl}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-300"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            data-testid={`product-image-${product.id}`}
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Discount Badge */}
        {hasDiscount && discountPercentage > 0 && (
          <Badge
            className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold shadow-sm"
            data-testid={`product-discount-${product.id}`}
          >
            {discountPercentage}% OFF
          </Badge>
        )}

        {/* Stock Status Badge */}
        {product.stock < 5 && product.stock > 0 && (
          <Badge
            variant="outline"
            className="absolute top-2 left-2 mt-8 bg-orange-100 text-orange-700 border-orange-300 text-xs"
          >
            Only {product.stock} left
          </Badge>
        )}

        {/* Out of Stock Badge */}
        {product.stock === 0 && (
          <Badge
            className="absolute top-2 left-2 bg-gray-500 text-white text-xs"
          >
            Out of Stock
          </Badge>
        )}

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full shadow-sm"
          onClick={toggleWishlist}
          data-testid={`wishlist-button-${product.id}`}
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? "text-red-500 fill-current" : "text-muted-foreground"
            }`} 
          />
        </Button>
      </div>

      <CardContent className="p-3">
        {/* Product Name */}
        <h3 
          className="font-semibold text-sm mb-1 line-clamp-2 leading-tight" 
          data-testid={`product-name-${product.id}`}
        >
          {product.name}
        </h3>

        {/* Product Description */}
        <p 
          className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed" 
          data-testid={`product-description-${product.id}`}
        >
          {product.description}
        </p>

        {/* Vendor Info */}
        {/* {primaryVendor && (
          <div className="flex items-center text-xs text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 mr-1" />
            <span className="truncate">{primaryVendor.name}</span>
          </div>
        )} */}

        {/* Rating Display */}
        {totalRatings > 0 ? (
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {/* Star Rating Display */}
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(averageRating) 
                      ? "text-yellow-500 fill-current" 
                      : i < averageRating 
                      ? "text-yellow-500 fill-current opacity-50"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span 
              className="text-xs text-muted-foreground ml-1 font-medium" 
              data-testid={`product-rating-${product.id}`}
            >
              {roundedRating}
            </span>
            <span className="text-xs text-muted-foreground mx-1">•</span>
            <span className="text-xs text-muted-foreground">
              {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
            </span>
          </div>
        ) : (
          <div className="flex items-center mb-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 text-gray-300" />
              ))}
            </div>
            <span className="text-xs text-muted-foreground ml-1">No reviews yet</span>
          </div>
        )}

        {/* Categories */}
        {/* {product.categories && product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {product.categories.slice(0, 2).map((category) => (
              <Badge 
                key={category.id} 
                className="text-xs px-1 py-0"
              >
                {category.name}
              </Badge>
            ))}
            {product.categories.length > 2 && (
              <Badge className="text-xs px-1 py-0">
                +{product.categories.length - 2}
              </Badge>
            )}
          </div>
        )} */}

        {/* Price and Add to Cart Section */}
        <div className="flex items-center justify-between">
          {/* Price Display */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-1">
              <span 
                className="font-bold text-primary text-sm" 
                data-testid={`product-price-${product.id}`}
              >
                ₹{formatPrice(hasDiscount && discountedPrice ? discountedPrice : originalPrice)}
              </span>
              {hasDiscount && discountedPrice && (
                <span className="text-xs text-muted-foreground line-through">
                  ₹{formatPrice(originalPrice)}
                </span>
              )}
            </div>
            {hasDiscount && discountedPrice && (
              <span className="text-xs text-green-600 font-medium">
                Save ₹{formatPrice(originalPrice - discountedPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Controls */}
          <div className="flex items-center space-x-1">
            {quantity > 0 ? (
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 hover:bg-background"
                  onClick={handleDecreaseQuantity}
                  data-testid={`decrease-quantity-${product.id}`}
                  disabled={product.stock === 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <span 
                  className="w-6 text-center font-semibold text-sm" 
                  data-testid={`product-quantity-${product.id}`}
                >
                  {quantity}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="w-6 h-6 hover:bg-background"
                  onClick={handleIncreaseQuantity}
                  disabled={isAddingToCart || product.stock === 0 || quantity >= product.stock}
                  data-testid={`increase-quantity-${product.id}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                className="h-8 px-3 text-xs font-medium"
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock === 0}
                data-testid={`add-to-cart-${product.id}`}
              >
                {isAddingToCart ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Adding...</span>
                  </div>
                ) : product.stock === 0 ? (
                  'Out of Stock'
                ) : (
                  <>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Delivery Info */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            <span>15-20 min</span>
          </div>
          <div className="flex items-center">
            <span className="text-green-600 font-medium">Free delivery</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
