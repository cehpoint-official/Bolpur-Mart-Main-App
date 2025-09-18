"use client"
import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Next.js router
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft,
  MapPin,
  CreditCard,
  Wallet,
  Banknote,
  Smartphone,
  Clock,
  Plus,
  Check
} from "lucide-react";

export default function Checkout() {
  const router = useRouter(); // ✅ Using Next.js navigation
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const userId = "mock-user-id";
  const { cartItems, cartSummary, clearCart } = useCart(userId);
  
  const [selectedAddress, setSelectedAddress] = useState("address-1");
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [deliverySlot, setDeliverySlot] = useState("next-2-hours");
  const [orderNotes, setOrderNotes] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Mock addresses - in production, fetch from user profile
  const addresses = [
    {
      id: "address-1",
      label: "Home",
      address: "123 Main Street, Bolpur, West Bengal 731204",
      isDefault: true
    },
    {
      id: "address-2", 
      label: "Work",
      address: "456 Business Park, Santiniketan, West Bengal 731235",
      isDefault: false
    }
  ];

  const paymentMethods = [
    { id: "upi", label: "UPI", icon: Smartphone, description: "Pay using UPI apps" },
    { id: "card", label: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard, RuPay" },
    { id: "wallet", label: "Wallet", icon: Wallet, description: "Paytm, PhonePe, Google Pay" },
    { id: "cod", label: "Cash on Delivery", icon: Banknote, description: "Pay when order arrives" }
  ];

  const deliverySlots = [
    { id: "next-2-hours", label: "Next 2 Hours", fee: 0, description: "Standard delivery" },
    { id: "express-1-hour", label: "Express (1 Hour)", fee: 25, description: "Priority delivery" },
    { id: "scheduled", label: "Schedule for Later", fee: 0, description: "Choose your time" }
  ];

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (order) => {
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: `Order #${order.id.slice(-6).toUpperCase()} has been confirmed`,
      });
      window.location.href = "/orders";
    },
    onError: () => {
      toast({
        title: "Order failed",
        description: "Unable to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart first",
        variant: "destructive",
      });
      return;
    }

    setIsPlacingOrder(true);

    const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
    const orderItems = cartItems.map(item => ({
      productId: item.productId,
      name: item.product?.name,
      price: item.product?.discountedPrice || item.product?.price,
      quantity: item.quantity,
      variant: item.variant
    }));

    const orderData = {
      userId,
      items: orderItems,
      totalAmount: cartSummary.total.toString(),
      deliveryAddress: {
        label: selectedAddr?.label,
        address: selectedAddr?.address
      },
      paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "pending" : "paid",
      notes: orderNotes,
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000), // 45 minutes from now
    };

    try {
      await createOrderMutation.mutateAsync(orderData);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="mobile-container">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = "/"}
              data-testid="back-to-home"
            >
              <ArrowLeft size={20} />
            </Button>
            <h1 className="font-bold text-xl ml-3">Checkout</h1>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛒</span>
            </div>
            <h3 className="font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add some items to proceed with checkout
            </p>
            <Button onClick={() => window.location.href = "/"}>
              Start Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border" data-testid="checkout-header">
        <div className="flex items-center p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = "/"}
            data-testid="back-button"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="font-bold text-xl ml-3">Checkout</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="p-4 space-y-6">
          {/* Delivery Address */}
          <Card data-testid="delivery-address-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="mr-2" size={20} />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                {addresses.map((address) => (
                  <div key={address.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                    <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">{address.label}</span>
                        {address.isDefault && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{address.address}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              
              <Button variant="outline" className="w-full mt-3" data-testid="add-address">
                <Plus size={16} className="mr-2" />
                Add New Address
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Slot */}
          <Card data-testid="delivery-slot-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2" size={20} />
                Delivery Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliverySlot} onValueChange={setDeliverySlot}>
                {deliverySlots.map((slot) => (
                  <div key={slot.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value={slot.id} id={slot.id} className="mt-1" />
                    <Label htmlFor={slot.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{slot.label}</span>
                        {slot.fee > 0 && (
                          <span className="text-sm font-medium">+₹{slot.fee}</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{slot.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card data-testid="payment-method-section">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2" size={20} />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value={method.id} id={method.id} className="mt-1" />
                    <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center space-x-2 mb-1">
                        <method.icon size={16} />
                        <span className="font-medium">{method.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card data-testid="order-notes-section">
            <CardHeader>
              <CardTitle>Special Instructions (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any special delivery instructions..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="min-h-[80px]"
                data-testid="order-notes-input"
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card data-testid="order-summary-section">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.product?.discountedPrice || item.product?.price}
                      </p>
                    </div>
                    <span className="font-medium">
                      ₹{((parseFloat(item.product?.discountedPrice || item.product?.price || "0")) * item.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartSummary.subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span className={cartSummary.deliveryFee === 0 ? "text-green-600" : ""}>
                      {cartSummary.deliveryFee === 0 ? "FREE" : `₹${cartSummary.deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxes & Charges</span>
                    <span>₹{cartSummary.taxes}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{cartSummary.total.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-xl font-bold">₹{cartSummary.total.toFixed(0)}</p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{cartSummary.itemCount} items</p>
            <p>Delivering to {addresses.find(a => a.id === selectedAddress)?.label}</p>
          </div>
        </div>
        
        <Button
          onClick={handlePlaceOrder}
          disabled={isPlacingOrder}
          className="w-full py-3 text-lg font-bold"
          data-testid="place-order-button"
        >
          {isPlacingOrder ? (
            "Placing Order..."
          ) : (
            <>
              <Check className="mr-2" size={20} />
              Place Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
