"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Check, Clock, Phone, MapPin, Package } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import type { Order } from "@/types"

interface OrderTrackingModalProps {
  isOpen: boolean
  onClose: () => void
  orderId?: string
}

interface OrderStatus {
  id: string
  label: string
  description: string
  completed: boolean
  active: boolean
  timestamp?: string
}

export function OrderTrackingModal({ isOpen, onClose, orderId }: OrderTrackingModalProps) {
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([])

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ["/api/order", orderId],
    enabled: !!orderId && isOpen,
  })

  useEffect(() => {
    if (!order) return

    const statuses: OrderStatus[] = [
      {
        id: "placed",
        label: "Order Placed",
        description: "Order confirmed",
        completed: true,
        active: false,
        timestamp: order.createdAt
          ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : undefined,
      },
      {
        id: "confirmed",
        label: "Order Confirmed",
        description: "Restaurant accepted your order",
        completed: ["confirmed", "preparing", "out_for_delivery", "delivered"].includes(order.status),
        active: order.status === "confirmed",
        timestamp: order.status === "confirmed" ? "Just now" : undefined,
      },
      {
        id: "preparing",
        label: "Preparing Your Order",
        description: "Kitchen is working on it",
        completed: ["preparing", "out_for_delivery", "delivered"].includes(order.status),
        active: order.status === "preparing",
        timestamp: order.status === "preparing" ? "In progress" : undefined,
      },
      {
        id: "out_for_delivery",
        label: "Out for Delivery",
        description: "Rider assigned and on the way",
        completed: ["out_for_delivery", "delivered"].includes(order.status),
        active: order.status === "out_for_delivery",
        timestamp: order.status === "out_for_delivery" ? "En route" : undefined,
      },
      {
        id: "delivered",
        label: "Delivered",
        description: "Enjoy your meal!",
        completed: order.status === "delivered",
        active: false,
        timestamp: order.status === "delivered" ? "Completed" : undefined,
      },
    ]

    setOrderStatuses(statuses)
  }, [order])

  const getStatusColor = (status: string) => {
    const colors = {
      delivered: "bg-green-500",
      out_for_delivery: "bg-blue-500",
      preparing: "bg-yellow-500",
      confirmed: "bg-blue-500",
      cancelled: "bg-red-500",
      placed: "bg-purple-500",
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  const getStatusIcon = (status: string) => {
    const icons = {
      delivered: Check,
      out_for_delivery: MapPin,
      preparing: Package,
      confirmed: Check,
      placed: Clock,
    }
    return icons[status as keyof typeof icons] || Clock
  }

  const getEstimatedDelivery = () => {
    if (!order || order.status === "delivered") return null

    const estimatedMinutes = {
      placed: 35,
      confirmed: 30,
      preparing: 25,
      out_for_delivery: 10,
    }[order.status] || 30

    return `${estimatedMinutes}-${estimatedMinutes + 10} mins`
  }

  const getCurrentStatusInfo = () => {
    return orderStatuses.find(s => s.id === order?.status) || orderStatuses[0]
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] flex flex-col" data-testid="order-tracking-modal">
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Order Tracking</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-order-tracking">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {isLoading || !order ? (
          <div className="flex-1 flex items-center justify-center py-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Order Status Header */}
            <div className="text-center">
              <div
                className={`w-20 h-20 ${getStatusColor(order.status)} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}
              >
                {(() => {
                  const StatusIcon = getStatusIcon(order.status)
                  return <StatusIcon className="text-white" size={32} />
                })()}
              </div>

              <h3 className="font-bold text-lg mb-2" data-testid="order-status">
                {getCurrentStatusInfo().label}
              </h3>

              <p className="text-muted-foreground text-sm mb-2">
                {getCurrentStatusInfo().description}
              </p>

              {getEstimatedDelivery() && (
                <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4 mr-1" />
                  {getEstimatedDelivery()}
                </div>
              )}

              <p className="text-sm text-muted-foreground mt-3">
                Order ID:{" "}
                <span className="font-mono font-semibold text-foreground" data-testid="order-id">
                  #{order.id.slice(-8).toUpperCase()}
                </span>
              </p>
            </div>

            {/* Order Progress Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
              <div className="space-y-6">
                {orderStatuses.map((status, index) => (
                  <div key={status.id} className="relative flex items-start space-x-4">
                    {/* Status Indicator */}
                    <div className="relative z-10 flex-shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                          status.completed
                            ? "bg-green-500 border-green-500"
                            : status.active
                            ? "bg-blue-500 border-blue-500 animate-pulse"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {status.completed ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : status.active ? (
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        ) : (
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        )}
                      </div>
                    </div>

                    {/* Status Content */}
                    <div className="flex-1 min-w-0 pb-6">
                      <div className="flex items-center justify-between">
                        <p
                          className={`font-semibold ${
                            status.completed || status.active ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {status.label}
                        </p>
                        {status.timestamp && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {status.timestamp}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{status.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Person Info */}
            {(order.status === "out_for_delivery" || order.status === "preparing") && (
              <div className="bg-card p-4 rounded-xl border shadow-sm" data-testid="delivery-person-info">
                <h4 className="font-semibold mb-3">Delivery Partner</h4>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src="/api/placeholder/48/48"
                      alt="Delivery Person"
                      className="w-12 h-12 rounded-full object-cover bg-gray-200"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium" data-testid="delivery-person-name">
                      Rajesh Kumar
                    </h3>
                    <p className="text-sm text-muted-foreground">Delivery Partner</p>
                    <div className="flex items-center text-sm mt-1">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1 text-foreground">4.8</span>
                      <span className="text-muted-foreground ml-1">(250+ deliveries)</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-full"
                    data-testid="call-delivery-person"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Order Items Summary */}
            <div className="bg-muted/50 p-4 rounded-xl">
              <h4 className="font-semibold mb-3">Order Summary</h4>
              <div className="space-y-2">
                {/* Order Items */}
                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="space-y-1 mb-3">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.quantity}x {item.productName}
                        </span>
                        <span>₹{Number.parseFloat(item.price || "0").toFixed(0)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                )}

                {/* Order Total */}
                <div className="border-t pt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Items Total</span>
                    <span>₹{Number.parseFloat(order.totalAmount).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total Amount</span>
                    <span>₹{Number.parseFloat(order.totalAmount).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="bg-muted/50 p-4 rounded-xl">
                <h4 className="font-semibold mb-2">Delivery Address</h4>
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">{order.deliveryAddress.type?.toUpperCase()}</p>
                    <p className="text-muted-foreground">
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}
                    </p>
                    <p className="text-muted-foreground">
                      {order.deliveryAddress.state} - {order.deliveryAddress.zipCode}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
