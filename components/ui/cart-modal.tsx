"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, ShoppingBag, Clock, X } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import {
  getOptimizedImageUrl,
  getPlaceholderUrl,
} from "@/lib/cloudinary-config";
import { useQuery } from "@tanstack/react-query";
import { FirebaseProductService } from "@/lib/firebase-products";
import Image from "next/image";
import type { Product } from "@/types";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
  userId: string;
}

export function CartModal({
  isOpen,
  onClose,
  onCheckout,
  userId,
}: CartModalProps) {
  const { items, updateQuantity, removeItem, loading } = useCartStore();

  // Fetch product details for cart items
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["cart-products", items.map(item => item.productId)],
    queryFn: async (): Promise<Product[]> => {
      if (items.length === 0) return [];
      
      const productIds = [...new Set(items.map(item => item.productId))];
      const productPromises = productIds.map(id => 
        FirebaseProductService.getProductById(id)
      );
      
      const products = await Promise.all(productPromises);
      // Filter out null values and return only valid products
      return products.filter((product): product is Product => product !== null);
    },
    enabled: items.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create cart items with product details
  const cartItems = useMemo(() => {
    return items.map(item => {
      const product = products.find((p: Product) => p.id === item.productId);
      return {
        ...item,
        product
      };
    });
  }, [items, products]);

  // Calculate cart summary
  const cartSummary = useMemo(() => {
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const subtotal = cartItems.reduce((sum, item) => {
      if (!item.product) return sum;
      
      const price = item.product.hasDiscount && item.product.discountedPrice 
        ? item.product.discountedPrice 
        : item.product.price;
      
      return sum + (price * item.quantity);
    }, 0);
    
    const deliveryFee = subtotal > 500 ? 0 : 50;
    const taxes = Math.round(subtotal * 0.05); // 5% tax
    const total = subtotal + deliveryFee + taxes;

    return {
      itemCount,
      subtotal,
      deliveryFee,
      taxes,
      total
    };
  }, [cartItems]);

  const handleQuantityChange = async (cartItemId: string, newQuantity: number) => {
    await updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = async (cartItemId: string) => {
    await removeItem(cartItemId);
  };

  const handleCheckout = () => {
    onCheckout();
    onClose();
  };

  const getItemPrice = (product: Product | undefined) => {
    if (!product) return 0;
    return product.hasDiscount && product.discountedPrice 
      ? product.discountedPrice 
      : product.price;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md sm:max-w-md h-[78vh] flex flex-col "
        data-testid="cart-modal"
      >
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>Your Cart</DialogTitle>
          </div>
        </DialogHeader>

        {cartItems.length === 0 || productsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                {productsLoading ? (
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-semibold mb-2">
                {productsLoading ? "Loading cart..." : "Your cart is empty"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {productsLoading 
                  ? "Please wait while we fetch your items"
                  : "Add some delicious items to get started!"
                }
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {cartItems.map((item) => {
                const product = item.product;
                const price = getItemPrice(product);
                const imageUrl = product?.imageUrl
                  ? getOptimizedImageUrl(product.imageUrl, {
                      width: 80,
                      height: 80,
                      crop: "fill",
                    })
                  : getPlaceholderUrl(80, 80);

                return (
                  <div
                    key={item.id}
                    className="flex items-center space-x-3 bg-card p-3 rounded-xl"
                    data-testid={`cart-item-${item.id}`}
                  >
                    {/* Product image */}
                    <Image
                      src={imageUrl}
                      alt={product?.name || "Product"}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                      data-testid={`cart-item-image-${item.id}`}
                    />
                    <div className="flex-1">
                      <h3
                        className="font-medium"
                        data-testid={`cart-item-name-${item.id}`}
                      >
                        {product?.name || "Loading..."}
                      </h3>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant}
                        </p>
                      )}
                      <p
                        className="font-semibold text-primary"
                        data-testid={`cart-item-price-${item.id}`}
                      >
                        ₹{price}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        disabled={loading || item.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span
                        className="font-semibold w-8 text-center"
                        data-testid={`cart-item-quantity-${item.id}`}
                      >
                        {item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        disabled={loading || (product && item.quantity >= product.stock)}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={loading}
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Billing summary */}
            <div
              className="flex-shrink-0 bg-muted/50 p-4 rounded-xl mb-4"
              data-testid="bill-details"
            >
              <h3 className="font-semibold mb-3">Bill Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span data-testid="bill-subtotal">
                    ₹{cartSummary.subtotal.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Delivery Fee</span>
                  <span data-testid="bill-delivery-fee">
                    {cartSummary.deliveryFee === 0
                      ? "FREE"
                      : `₹${cartSummary.deliveryFee}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Taxes & Charges</span>
                  <span data-testid="bill-taxes">₹{cartSummary.taxes}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span data-testid="bill-total">
                    ₹{cartSummary.total.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCheckout}
              className="w-full py-4 text-lg font-bold"
              data-testid="proceed-to-checkout"
              disabled={loading || cartItems.length === 0}
            >
              {loading ? "Processing..." : "Proceed to Checkout"}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
