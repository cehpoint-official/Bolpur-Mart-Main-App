// components/ui/notification-bell.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Package,
  Percent,
  Gift,
  Clock,
  X,
  Check,
  Loader2,
  CreditCard,
  XCircle,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  MoreHorizontal,
} from "lucide-react";
import { FirebaseNotificationService } from "@/lib/firebase-notification-service";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { Notification } from "@/types";

interface NotificationBellProps {
  onNotificationCount?: (count: number) => void;
}

export function NotificationBell({
  onNotificationCount,
}: NotificationBellProps) {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [displayedNotifications, setDisplayedNotifications] = useState<
    Notification[]
  >([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string>("");
  const [showAll, setShowAll] = useState(false);

  // Constants for UI limits
  const INITIAL_DISPLAY_LIMIT = 8; // Show only 8 notifications initially
  const MAX_NOTIFICATIONS = 50; // Maximum notifications to keep in memory

  // Audio reference for notification sound
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const prevNotificationCountRef = useRef<number>(0);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification-sound.mp3");
    audioRef.current.volume = 0.7;
    audioRef.current.preload = "auto";

    return () => {
      if (audioRef.current) {
        audioRef.current = null;
      }
    };
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((error) => {
        console.log("Could not play notification sound:", error);
      });
    }
  }, []);

  // Update displayed notifications based on showAll state
  useEffect(() => {
    if (notifications.length <= INITIAL_DISPLAY_LIMIT) {
      setDisplayedNotifications(notifications);
    } else {
      if (showAll) {
        setDisplayedNotifications(notifications.slice(0, MAX_NOTIFICATIONS));
      } else {
        setDisplayedNotifications(
          notifications.slice(0, INITIAL_DISPLAY_LIMIT)
        );
      }
    }
  }, [notifications, showAll, INITIAL_DISPLAY_LIMIT, MAX_NOTIFICATIONS]);

  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440)
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Get notification icon with payment verification support
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "customer_order_placed":
      case "order_update":
        return Package;
      case "offer":
        return Percent;
      case "info":
        return Gift;
      case "delivery_update":
        return Clock;
      case "payment_verified":
        return CheckCircle;
      case "payment_rejected":
        return XCircle;
      default:
        return Bell;
    }
  };

  // Get notification icon color with payment verification support
  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "customer_order_placed":
        return "text-green-600";
      case "offer":
        return "text-orange-600";
      case "info":
        return "text-blue-600";
      case "order_update":
      case "delivery_update":
        return "text-purple-600";
      case "payment_verified":
        return "text-green-600";
      case "payment_rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Get notification background color for high priority
  const getNotificationBackgroundColor = (notification: Notification) => {
    if (notification.type === "payment_rejected") {
      return notification.isRead ? "bg-red-50/30" : "bg-red-50";
    }
    if (notification.type === "payment_verified") {
      return notification.isRead ? "bg-green-50/30" : "bg-green-50";
    }
    return notification.isRead ? "" : "bg-blue-50/50";
  };

  // Load notifications when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.uid) {
      setNotifications([]);
      setUnreadCount(0);
      setInitialLoading(false);
      return;
    }

    // Subscribe to real-time notifications
    const unsubscribe =
      FirebaseNotificationService.subscribeToUserNotifications(
        user.uid,
        (newNotifications) => {
          // Limit notifications to prevent memory issues
          const limitedNotifications = newNotifications.slice(
            0,
            MAX_NOTIFICATIONS
          );

          setNotifications(limitedNotifications);
          const newUnreadCount = limitedNotifications.filter(
            (n) => !n.isRead
          ).length;

          // Play sound only if unread count increased (new notification received)
          // And only after initial loading is complete
          if (
            newUnreadCount > prevNotificationCountRef.current &&
            prevNotificationCountRef.current >= 0 &&
            !initialLoading
          ) {
            playNotificationSound();

            // Show toast for new notification with special handling for payment notifications
            const latestNotification = limitedNotifications[0];
            if (latestNotification && !latestNotification.isRead) {
              toast({
                title: latestNotification.title,
                description: latestNotification.message,
                variant:
                  latestNotification.type === "payment_rejected"
                    ? "destructive"
                    : "default",
              });
            }
          }

          setUnreadCount(newUnreadCount);
          prevNotificationCountRef.current = newUnreadCount;
          setInitialLoading(false);
          setRefreshing(false);

          // Call callback if provided
          if (onNotificationCount) {
            onNotificationCount(newUnreadCount);
          }
        },
        (error) => {
          console.error("Error subscribing to notifications:", error);
          setInitialLoading(false);
          setRefreshing(false);
        }
      );

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [
    isAuthenticated,
    user?.uid,
    onNotificationCount,
    playNotificationSound,
    initialLoading,
    MAX_NOTIFICATIONS,
  ]);

  // Handle notification bell click
  const handleNotificationClick = async () => {
    if (!showNotifications) {
      // Opening dropdown - set refreshing if we have no notifications yet
      if (notifications.length === 0 && !initialLoading) {
        setRefreshing(true);
      }
    }

    setShowNotifications(!showNotifications);

    if (!showNotifications && unreadCount > 0 && user?.uid) {
      // Mark all as read when opening notification panel
      try {
        await FirebaseNotificationService.markAllNotificationsAsRead(user.uid);
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    }
  };

  // Handle individual notification click
  const handleNotificationItemClick = async (notification: Notification) => {
    if (!notification.isRead && user?.uid) {
      setMarkingAsRead(notification.id);
      try {
        await FirebaseNotificationService.markNotificationAsRead(
          notification.id
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      } finally {
        setMarkingAsRead("");
      }
    }
  };

  // Handle show more/less notifications
  const handleToggleShowAll = () => {
    setShowAll(!showAll);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        showNotifications &&
        !target.closest('[data-testid="notifications-dropdown"]')
      ) {
        setShowNotifications(false);
        setShowAll(false); // Reset to show limited on close
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  // Don't show anything if not authenticated
  if (!isAuthenticated || !user?.uid) {
    return null;
  }

  const hasMoreNotifications = notifications.length > INITIAL_DISPLAY_LIMIT;
  const hiddenNotificationsCount = notifications.length - INITIAL_DISPLAY_LIMIT;

  return (
    <div className="relative">
      {/* Notification Bell Button - Always shows bell icon */}
      <Button
        variant="ghost"
        size="icon"
        className="relative border rounded-full hover:bg-gray-200"
        onClick={handleNotificationClick}
        data-testid="notifications-button"
      >
        <Bell size={20} />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}

        {/* Small loading indicator dot when refreshing (optional) */}
        {refreshing && (
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        )}
      </Button>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[60] animate-in slide-in-from-top-2 duration-200"
          data-testid="notifications-dropdown"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-lg">Notifications</h3>
                  {refreshing && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {refreshing
                    ? "Loading notifications..."
                    : unreadCount > 0
                    ? `${unreadCount} new notifications`
                    : notifications.length > 0
                    ? `${notifications.length} total notifications`
                    : "All caught up!"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowNotifications(false);
                  setShowAll(false); // Reset when closing
                }}
                className="h-8 w-8"
              >
                <X size={16} />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar">
            {refreshing && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading your notifications...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h4 className="font-medium text-sm mb-2">
                  No notifications yet
                </h4>
                <p className="text-xs text-muted-foreground">
                  We'll notify you when something important happens
                </p>
              </div>
            ) : (
              <>
                {displayedNotifications.map((notification, index) => {
                  const IconComponent = getNotificationIcon(notification.type);
                  const isMarking = markingAsRead === notification.id;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${getNotificationBackgroundColor(
                        notification
                      )} ${
                        index === displayedNotifications.length - 1 &&
                        !hasMoreNotifications
                          ? "border-b-0"
                          : ""
                      }`}
                      onClick={() => handleNotificationItemClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-full bg-gray-100 ${getNotificationIconColor(
                            notification.type
                          )} relative flex-shrink-0`}
                        >
                          <IconComponent size={16} />
                          {isMarking && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                              <Loader2 size={12} className="animate-spin" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                            {notification.message}
                          </p>

                          {/* Show payment method for payment notifications */}
                          {(notification.type === "payment_verified" ||
                            notification.type === "payment_rejected") &&
                            notification.paymentMethod && (
                              <div className="flex items-center mt-2 space-x-2 flex-wrap">
                                <CreditCard
                                  size={12}
                                  className="text-muted-foreground flex-shrink-0"
                                />
                                <span className="text-xs text-muted-foreground capitalize">
                                  {notification.paymentMethod.replace("_", " ")}
                                </span>
                                {notification.verificationStatus && (
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                      notification.verificationStatus ===
                                      "verified"
                                        ? "bg-green-100 text-green-600"
                                        : "bg-red-100 text-red-600"
                                    }`}
                                  >
                                    {notification.verificationStatus}
                                  </span>
                                )}
                              </div>
                            )}

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(notification.createdAt)}
                            </p>

                            {notification.priority === "high" && (
                              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full flex items-center flex-shrink-0">
                                <AlertTriangle size={10} className="mr-1" />
                                Priority
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Show More/Less Button */}
                {hasMoreNotifications && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50">
                    <Button
                      variant="ghost"
                      className="w-full text-sm flex items-center justify-center space-x-2"
                      onClick={handleToggleShowAll}
                    >
                      {showAll ? (
                        <>
                          <ChevronDown size={16} className="rotate-180" />
                          <span>Show Less</span>
                        </>
                      ) : (
                        <>
                          <MoreHorizontal size={16} />
                          <span>Show {hiddenNotificationsCount} More</span>
                          <ChevronDown size={16} />
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Show loading indicator at bottom when refreshing existing notifications */}
                {refreshing && notifications.length > 0 && (
                  <div className="p-4 text-center border-t border-gray-100">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Checking for updates...
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
