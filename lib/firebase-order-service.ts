// lib/firebase-order-service.ts
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Order, OrderItem, Address, DeliverySlot } from "@/types";

export class FirebaseOrderService {
  private static ordersCollection = "orders";
  private static notificationsCollection = "notifications";
  private static settingsCollection = "settings";

  // Generate unique order ID
  static generateOrderId(): string {
    const timestamp = Date.now().toString();
    const randomPart = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `ORD${timestamp.slice(-8)}${randomPart}`;
  }

  // Create new order
  // Create new order
  static async createOrder(orderData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress: Address;
    items: OrderItem[];
    subtotal: number;
    deliveryFee: number;
    taxes: number;
    discount: number;
    total: number;
    paymentMethod: "cash_on_delivery" | "upi_online";
    paymentDetails?: {
      upiTransactionId?: string;
      paymentScreenshot?: string;
      upiId?: string;
      verificationStatus?: "pending" | "verified" | "rejected";
    };
    deliverySlot: {
      type: "immediate" | "express" | "scheduled";
      estimatedTime: Date;
      fee: number;
      scheduledDate?: string;
      scheduledTime?: string;
    };
    notes?: string;
    specialInstructions?: string;
  }): Promise<Order> {
    try {
      const orderNumber = this.generateOrderId();
      const now = new Date();

      // Build clean delivery slot
      const deliverySlot: any = {
        type: orderData.deliverySlot.type,
        estimatedTime: orderData.deliverySlot.estimatedTime,
        fee: orderData.deliverySlot.fee,
      };

      // Only add scheduled fields if they exist
      if (orderData.deliverySlot.scheduledDate) {
        deliverySlot.scheduledDate = orderData.deliverySlot.scheduledDate;
      }
      if (orderData.deliverySlot.scheduledTime) {
        deliverySlot.scheduledTime = orderData.deliverySlot.scheduledTime;
      }

      // Build payment details with proper structure
      let finalPaymentDetails: any = {};

      if (
        orderData.paymentMethod === "upi_online" &&
        orderData.paymentDetails
      ) {
        finalPaymentDetails = {
          upiTransactionId: orderData.paymentDetails.upiTransactionId || "",
          paymentScreenshot: orderData.paymentDetails.paymentScreenshot || "",
          upiId: orderData.paymentDetails.upiId || "",
          verificationStatus:
            orderData.paymentDetails.verificationStatus || "pending",
        };
      } else if (orderData.paymentMethod === "cash_on_delivery") {
        finalPaymentDetails = {
          verificationStatus: "pending",
        };
      }

      const order: Omit<Order, "id"> = {
        orderNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        customerEmail: orderData.customerEmail,
        deliveryAddress: orderData.deliveryAddress,
        items: orderData.items,
        subtotal: orderData.subtotal,
        deliveryFee: orderData.deliveryFee,
        taxes: orderData.taxes,
        discount: orderData.discount,
        total: orderData.total,
        status: "placed",
        paymentStatus: "pending",
        paymentMethod: orderData.paymentMethod,
        paymentDetails: finalPaymentDetails,
        deliverySlot,
        notes: orderData.notes,
        specialInstructions: orderData.specialInstructions,
        orderTracking: {
          placedAt: now,
        },
        createdAt: now,
        updatedAt: now,
        isRefundable: true,
        isCancellable: true,
        estimatedDeliveryTime: orderData.deliverySlot.estimatedTime,
      };

      // Clean undefined fields
      const cleanOrder = Object.fromEntries(
        Object.entries(order).filter(([_, value]) => value !== undefined)
      );

      const docRef = await addDoc(collection(db, this.ordersCollection), {
        ...cleanOrder,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        orderTracking: {
          placedAt: serverTimestamp(),
        },
      });

      const createdOrder: Order = {
        id: docRef.id,
        ...order,
      };

      await this.createOrderNotifications(createdOrder);
      return createdOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  // Create notifications for order
  static async createOrderNotifications(order: Order): Promise<void> {
    const batch = writeBatch(db);

    // Admin notification
    const adminNotificationRef = doc(
      collection(db, this.notificationsCollection)
    );
    batch.set(adminNotificationRef, {
      type: "admin_order_placed",
      title: "New Order Received",
      message: `New order ${order.orderNumber} placed by ${order.customerName}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
      isRead: false,
      targetAudience: "admin",
      createdAt: serverTimestamp(),
      priority: "high",
    });

    // Customer notification
    const customerNotificationRef = doc(
      collection(db, this.notificationsCollection)
    );
    batch.set(customerNotificationRef, {
      type: "customer_order_placed",
      title: "Order Placed Successfully",
      message: `Your order ${order.orderNumber} has been placed successfully. Total: ₹${order.total}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      total: order.total,
      isRead: false,
      targetAudience: "customer",
      createdAt: serverTimestamp(),
      priority: "normal",
    });

    await batch.commit();
  }

  // Get user orders
  static async getUserOrders(
    userId: string,
    limitCount: number = 20
  ): Promise<Order[]> {
    try {
      const ordersRef = collection(db, this.ordersCollection);
      const q = query(
        ordersRef,
        where("customerId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const orders: Order[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          estimatedDeliveryTime:
            data.estimatedDeliveryTime?.toDate() || new Date(),
          deliverySlot: {
            ...data.deliverySlot,
            estimatedTime:
              data.deliverySlot.estimatedTime?.toDate() || new Date(),
            actualDeliveryTime: data.deliverySlot.actualDeliveryTime?.toDate(),
          },
          orderTracking: {
            placedAt: data.orderTracking?.placedAt?.toDate() || new Date(),
            confirmedAt: data.orderTracking?.confirmedAt?.toDate(),
            preparingAt: data.orderTracking?.preparingAt?.toDate(),
            outForDeliveryAt: data.orderTracking?.outForDeliveryAt?.toDate(),
            deliveredAt: data.orderTracking?.deliveredAt?.toDate(),
          },
          reviewedAt: data.reviewedAt?.toDate(),
        } as Order);
      });

      return orders;
    } catch (error) {
      console.error("Error fetching user orders:", error);
      return [];
    }
  }

  // Get order by ID
  static async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const orderDoc = await getDoc(doc(db, this.ordersCollection, orderId));

      if (!orderDoc.exists()) return null;

      const data = orderDoc.data();
      return {
        id: orderDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        estimatedDeliveryTime:
          data.estimatedDeliveryTime?.toDate() || new Date(),
        deliverySlot: {
          ...data.deliverySlot,
          estimatedTime:
            data.deliverySlot.estimatedTime?.toDate() || new Date(),
          actualDeliveryTime: data.deliverySlot.actualDeliveryTime?.toDate(),
        },
        orderTracking: {
          placedAt: data.orderTracking?.placedAt?.toDate() || new Date(),
          confirmedAt: data.orderTracking?.confirmedAt?.toDate(),
          preparingAt: data.orderTracking?.preparingAt?.toDate(),
          outForDeliveryAt: data.orderTracking?.outForDeliveryAt?.toDate(),
          deliveredAt: data.orderTracking?.deliveredAt?.toDate(),
        },
        reviewedAt: data.reviewedAt?.toDate(),
      } as Order;
    } catch (error) {
      console.error("Error fetching order:", error);
      return null;
    }
  }

  // Update order status
  static async updateOrderStatus(
    orderId: string,
    status: Order["status"],
    trackingUpdate?: Partial<Order["orderTracking"]>
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
      };

      if (trackingUpdate) {
        updateData[`orderTracking.${Object.keys(trackingUpdate)[0]}`] =
          serverTimestamp();
      }

      await updateDoc(doc(db, this.ordersCollection, orderId), updateData);
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // Cancel order
  static async cancelOrder(orderId: string, reason?: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.ordersCollection, orderId), {
        status: "cancelled",
        cancelReason: reason,
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isCancellable: false,
      });
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw error;
    }
  }
}
