"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TimeBanner } from "@/components/ui/time-banner";
import { CategoryTabs } from "@/components/ui/category-tabs";
import { ProductCard } from "@/components/ui/product-card";
import { AIRecommendations } from "@/components/ui/ai-recommendations";
import { FloatingCart } from "@/components/ui/floating-cart";
import { CartModal } from "@/components/ui/cart-modal";
import {
  Search,
  SlidersHorizontal,
  Bell,
  HomeIcon,
  ClipboardList,
  User,
  ShoppingBag,
  MapPin,
  Grid3X3,
  List,
  X,
  LogIn,
  Clock,
  Package,
  Gift,
  Percent,
} from "lucide-react";
import { useTimeSlot } from "@/hooks/use-time-slot";
import { useAuth } from "@/hooks/use-auth";
import type { Product } from "@/types";
import Image from "next/image";

// Static notifications data
const STATIC_NOTIFICATIONS = [
  {
    id: "1",
    title: "Order Delivered! 🎉",
    message: "Your Biryani order has been delivered successfully",
    time: "2 minutes ago",
    type: "success",
    icon: Package,
    unread: true,
  },
  {
    id: "2", 
    title: "Special Offer! 🔥",
    message: "Get 40% off on all vegetables today only",
    time: "1 hour ago",
    type: "offer",
    icon: Percent,
    unread: true,
  },
  {
    id: "3",
    title: "New Arrival! ✨",
    message: "Fresh organic fruits now available in your area",
    time: "3 hours ago", 
    type: "info",
    icon: Gift,
    unread: false,
  },
  {
    id: "4",
    title: "Delivery Update",
    message: "Your evening order will arrive in 15 minutes",
    time: "5 hours ago",
    type: "update", 
    icon: Clock,
    unread: false,
  },
];

interface LocationState {
  city: string;
  state: string;
  loading: boolean;
  error: string | null;
}

export default function Home() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(STATIC_NOTIFICATIONS);
  const [location, setLocation] = useState<LocationState>({
    city: "Bolpur",
    state: "West Bengal", 
    loading: true,
    error: null,
  });

  const { currentTimeSlot } = useTimeSlot();

  // Fetch user's current location
  useEffect(() => {
    const fetchLocation = async () => {
      if (!navigator.geolocation) {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: "Geolocation not supported"
        }));
        return;
      }

      try {
        // First try to get coordinates
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true
          });
        });

        const { latitude, longitude } = position.coords;

        // Use Google Maps Geocoding API to get city and state
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );

        if (!response.ok) {
          throw new Error("Geocoding failed");
        }

        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const addressComponents = result.address_components;
          
          let city = "Bolpur";
          let state = "West Bengal";
          
          // Extract city and state from address components
          addressComponents.forEach((component: any) => {
            if (component.types.includes("locality") || component.types.includes("administrative_area_level_2")) {
              city = component.long_name;
            }
            if (component.types.includes("administrative_area_level_1")) {
              state = component.long_name;
            }
          });

          setLocation({
            city,
            state,
            loading: false,
            error: null,
          });
        } else {
          throw new Error("No location data found");
        }
      } catch (error) {
        console.error("Location fetch error:", error);
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: "Could not fetch location"
        }));
      }
    };

    fetchLocation();
  }, []);

  // Handle notification bell click
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      // Mark notifications as read when opened
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, unread: false }))
      );
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => n.unread).length;

  // Get notification icon color based on type
  const getNotificationIconColor = (type: string) => {
    switch (type) {
      case "success": return "text-green-600";
      case "offer": return "text-orange-600"; 
      case "info": return "text-blue-600";
      case "update": return "text-purple-600";
      default: return "text-gray-600";
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId === selectedCategory ? "" : categoryId);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleAuthClick = () => {
    router.push("/auth");
  };
console.log(user);

  return (
    <div className="mobile-container border">
      {/* Navigation Header */}
      <header
        className="sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 border-b border-border/50"
        data-testid="navigation-header"
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <ShoppingBag className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-xl text-foreground">Bolpur Mart</h1>
              <div className="text-xs text-muted-foreground flex items-center">
                <MapPin size={12} className="mr-1" />
                {location.loading ? (
                  <div className="flex items-center space-x-1">
                    <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
                    <span>,</span>
                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <span>{location.city}, {location.state}</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="relative border rounded-full hover:bg-gray-200"
                onClick={handleNotificationClick}
                data-testid="notifications-button"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    <p className="text-sm text-muted-foreground">
                      {unreadCount > 0 ? `${unreadCount} new notifications` : 'All caught up!'}
                    </p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => {
                      const IconComponent = notification.icon;
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                            notification.unread ? 'bg-blue-50/50' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-full bg-gray-100 ${getNotificationIconColor(notification.type)}`}>
                              <IconComponent size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                                {notification.unread && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="p-3 border-t border-gray-100">
                    <Button 
                      variant="ghost" 
                      className="w-full text-sm"
                      onClick={() => setShowNotifications(false)}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile or Login Button */}
            {authLoading ? (
              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
            ) : isAuthenticated && user ? (
              <Button
                variant="ghost"
                size="icon"
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20"
                onClick={() => router.push("/account")}
                data-testid="profile-button"
              >
                {user.customData?.avatar || user.photoURL ? (
                  <Image
                    src={user.customData?.avatar || user.photoURL || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8oghbsuzggpkknQSSU-Ch_xep_9v3m6EeBQ&s"}
                    alt="Profile"
                      className="w-full h-full object-cover"
                    width={40}
                    height={40}
                  />
                ) : (
                  <User size={20} className="text-muted-foreground" />
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-1 px-3"
                onClick={handleAuthClick}
                data-testid="login-button"
              >
                <LogIn size={16} />
                <span className="text-sm font-medium">Login</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}

      {/* Time-Based Banner */}
      <TimeBanner />

      {/* Search and Filters */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <Input
            type="text"
            placeholder="Search for biryani, snacks, medicines..."
            className="pl-10 pr-12 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-ring"
            value={searchQuery}
            onChange={handleSearch}
            data-testid="search-input"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={toggleFilters}
            data-testid="filters-button"
          >
            <SlidersHorizontal size={18} />
          </Button>
        </div>

        {/* Active Filters */}
        {(searchQuery || selectedCategory) && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {searchQuery && (
              <Badge variant="secondary" className="whitespace-nowrap">
                Search: {searchQuery}
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => setSearchQuery("")}
                />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="whitespace-nowrap">
                Category Filter
                <X
                  size={14}
                  className="ml-1 cursor-pointer"
                  onClick={() => setSelectedCategory("")}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      {/* <CategoryTabs selectedCategory={selectedCategory} onCategorySelect={handleCategorySelect} /> */}

      {/* Featured Banner */}
      <div className="px-4 mb-6">
        <Card className="relative rounded-2xl overflow-hidden h-48 bg-gradient-to-r from-orange-400 to-red-500">
          <img
            src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400"
            alt="Special Biryani Offer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <CardContent className="absolute bottom-4 left-4 right-4 text-white p-0">
            <h3 className="font-bold text-xl mb-1">Today's Special</h3>
            <p className="text-sm opacity-90 mb-2">
              Authentic Kolkata Biryani - 40% Off
            </p>
            <Button
              className="px-4 py-2 bg-white text-black hover:bg-gray-100"
              data-testid="special-offer-button"
            >
              Order Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {/* <AIRecommendations userId={userId} /> */}

      {/* Products Grid */}
      <div className="px-4 mb-20">
        {/* Product content will go here */}
      </div>

      {/* Floating Cart */}
      {/* <FloatingCart userId={userId} onOpenCart={() => setIsCartOpen(true)} /> */}

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border border-border z-50"
        data-testid="bottom-navigation"
      >
        <div className="flex items-center justify-around py-3">
          <Button
            variant="ghost"
            className="flex flex-col items-center text-primary"
            data-testid="nav-home"
          >
            <HomeIcon size={20} />
            <span className="text-xs mt-1">Home</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center text-muted-foreground"
            onClick={() => handleNavigation("/search")}
            data-testid="nav-search"
          >
            <Search size={20} />
            <span className="text-xs mt-1">Search</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center text-muted-foreground"
            onClick={() => handleNavigation("/orders")}
            data-testid="nav-orders"
          >
            <ClipboardList size={20} />
            <span className="text-xs mt-1">Orders</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center text-muted-foreground"
            onClick={() => handleNavigation("/account")}
            data-testid="nav-account"
          >
            <User size={20} />
            <span className="text-xs mt-1">Account</span>
          </Button>
        </div>
      </nav>

      {/* Cart Modal */}
      {/* <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} userId={userId} /> */}
    </div>
  );
}
