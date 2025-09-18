"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ Next.js router
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrderTrackingModal } from "@/components/ui/order-tracking-modal";
import {
  Home,
  Search,
  ClipboardList,
  User,
  Clock,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import type { Order } from "@/types"; // ✅ Keep type import

export default function Orders() {
  const router = useRouter(); // ✅ Using Next.js navigation
  const [selectedOrderId, setSelectedOrderId] = useState<string>();
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  const userId = "mock-user-id";

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/user", userId],
  });

  /** Status Icons */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="text-green-500" size={20} />;
      case "out_for_delivery":
        return <Truck className="text-blue-500" size={20} />;
      case "preparing":
        return <Package className="text-yellow-500" size={20} />;
      case "confirmed":
        return <Clock className="text-blue-500" size={20} />;
      case "cancelled":
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  /** Status Badge Colors */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /** Status Text */
  const getStatusText = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered";
      case "out_for_delivery":
        return "Out for Delivery";
      case "preparing":
        return "Preparing";
      case "confirmed":
        return "Confirmed";
      case "cancelled":
        return "Cancelled";
      case "placed":
        return "Order Placed";
      default:
        return status;
    }
  };

  /** Handle Order Card Click */
  const handleOrderClick = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsTrackingOpen(true);
  };

  /** Handle Navigation (Next.js Router) */
  const handleNavigation = (path: string) => {
    router.push(path); // ✅ Replaced window.location.href
  };

  /** Date Formatter */
  const formatDate = (dateString: string | Date | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="mobile-container">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-background border-b border-border"
        data-testid="orders-header"
      >
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="font-bold text-xl">Your Orders</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage your orders
            </p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <ClipboardList className="text-primary" size={20} />
          </div>
        </div>
      </header>

      {/* Orders Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="skeleton-text w-24"></div>
                  <div className="skeleton w-20 h-6 rounded-full"></div>
                </div>
                <div className="skeleton-text w-full mb-2"></div>
                <div className="skeleton-text w-3/4 mb-3"></div>
                <div className="flex justify-between items-center">
                  <div className="skeleton-text w-20"></div>
                  <div className="skeleton-text w-16"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <ClipboardList className="text-muted-foreground" size={32} />
              </div>
              <h3 className="font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Start shopping to see your orders here
              </p>
              <Button
                onClick={() => handleNavigation("/")}
                data-testid="start-shopping-button"
              >
                Start Shopping
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {orders.map((order) => {
              const itemCount = Array.isArray(order.items)
                ? order.items.length
                : 0;

              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOrderClick(order.id)}
                  data-testid={`order-card-${order.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className="font-medium">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>

                    <div className="space-y-2 mb-3">
                      <p className="text-sm text-muted-foreground">
                        {itemCount} item{itemCount !== 1 ? "s" : ""} • ₹
                        {Number.parseFloat(order.totalAmount).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Ordered on {formatDate(order.createdAt)}
                      </p>
                      {order.estimatedDelivery && (
                        <p className="text-xs text-muted-foreground">
                          Estimated delivery: {formatDate(order.estimatedDelivery)}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {order.status === "delivered" ? (
                          <span className="text-green-600 font-medium">
                            ✓ Delivered
                          </span>
                        ) : order.status === "cancelled" ? (
                          <span className="text-red-600 font-medium">
                            ✗ Cancelled
                          </span>
                        ) : (
                          <span className="text-primary font-medium">
                            Track Order
                          </span>
                        )}
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border z-50"
        data-testid="bottom-navigation"
      >
        <div className="flex items-center justify-around py-2">
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 text-muted-foreground"
            onClick={() => handleNavigation("/")}
            data-testid="nav-home"
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 text-muted-foreground"
            onClick={() => handleNavigation("/search")}
            data-testid="nav-search"
          >
            <Search size={20} />
            <span className="text-xs mt-1">Search</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 text-primary"
            data-testid="nav-orders"
          >
            <ClipboardList size={20} />
            <span className="text-xs mt-1">Orders</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 text-muted-foreground"
            onClick={() => handleNavigation("/account")}
            data-testid="nav-account"
          >
            <User size={20} />
            <span className="text-xs mt-1">Account</span>
          </Button>
        </div>
      </nav>

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
        orderId={selectedOrderId}
      />
    </div>
  );
}
