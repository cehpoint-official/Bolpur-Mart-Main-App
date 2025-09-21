"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useInstallPrompt } from "@/components/pwa/install-prompt";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";

import Link from "next/link";
import { toast } from "@/components/ui/use-toast";
import { 
  Home,
  Search,
  Receipt,
  User,
  MapPin,
  CreditCard,
  Heart,
  HelpCircle,
  Shield,
  Bell,
  Smartphone,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  LogOut,
  ArrowLeft
} from "lucide-react";

export default function Account() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { installApp, canInstall } = useInstallPrompt();
  
  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const handleInstallPWA = () => {
    installApp();
  };

  const handleNotifications = () => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast({
              title: "Notifications Enabled",
              description: "You'll receive updates about your orders.",
            });
          }
        });
      } else if (Notification.permission === 'granted') {
        toast({
          title: "Already Enabled",
          description: "Notifications are already enabled.",
        });
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Not Supported",
        description: "Notifications are not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/auth';
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      icon: User,
      title: "Profile Information",
      description: "Update your personal details",
      action: () => router.push("/profile"),
      testId: "profile-menu"
    },
    {
      icon: MapPin,
      title: "Saved Addresses",
      description: "Manage delivery addresses",
      action: () => router.push("/addresses"),
      testId: "addresses-menu"
    },
    {
      icon: CreditCard,
      title: "Payment Methods",
      description: "Cards, UPI, and wallets",
      action: () => router.push("/payments"),
      testId: "payment-menu"
    },
    {
      icon: Heart,
      title: "Wishlist",
      description: "Your favorite items",
      action: () => toast({ title: "Coming Soon", description: "Wishlist feature is coming soon!" }),
      testId: "wishlist-menu"
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Order updates and offers",
      action: handleNotifications,
      testId: "notifications-menu"
    },
    {
      icon: Smartphone,
      title: "Install App",
      description: canInstall ? "Add to home screen" : "Already installed or not available",
      action: handleInstallPWA,
      disabled: !canInstall,
      testId: "install-app-menu"
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      description: "FAQs and customer support",
      action: () => toast({ 
        title: "Help & Support", 
        description: "Contact us at support@bolpurmart.com or call +91 98765 43210" 
      }),
      testId: "help-menu"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Data protection settings",
      action: () => toast({ title: "Coming Soon", description: "Privacy & Security settings coming soon!" }),
      testId: "privacy-menu"
    }
  ];

  // Format member since date
  const getMemberSince = () => {
    if (user?.metadata?.creationTime) {
      return new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      });
    }
    return "Recently";
  };

  // Get user avatar
  const getUserAvatar = () => {
    return user?.customData?.avatar || 
           "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS8oghbsuzggpkknQSSU-Ch_xep_9v3m6EeBQ&s";
  };

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border" data-testid="account-header">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Link href="/">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                data-testid="back-button"
              >
                <ArrowLeft size={20} />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-xl">Account</h1>
              <p className="text-sm text-muted-foreground">
                Manage your profile and preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Profile Section */}
        <div className="p-4">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Image
                    src={getUserAvatar()}
                    alt="Profile"
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    data-testid="profile-avatar"
                  />
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" data-testid="user-name">
                    {user?.displayName || user?.customData?.name || "Not set yet"}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail size={14} className="mr-2" />
                      {user?.email || "Not set yet"}
                    </div>
                    {(user?.customData?.phone || user?.phoneNumber) && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone size={14} className="mr-2" />
                        {user.customData?.phone || user.phoneNumber}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar size={14} className="mr-2" />
                      Member since {getMemberSince()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-xs text-muted-foreground">Orders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">₹0</div>
                <div className="text-xs text-muted-foreground">Saved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">0</div>
                <div className="text-xs text-muted-foreground">Favorites</div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-all duration-200">
                <CardContent className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-4 flex items-center justify-between"
                    onClick={item.action}
                    disabled={item.disabled}
                    data-testid={item.testId}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        item.disabled 
                          ? 'bg-muted text-muted-foreground' 
                          : 'bg-primary/10 text-primary hover:bg-primary/20'
                      }`}>
                        <item.icon size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className={`font-medium ${item.disabled ? 'text-muted-foreground' : ''}`}>
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Logout Section */}
          <div className="mt-8 mb-4">
            <Separator className="mb-4" />
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
              onClick={handleLogout}
              data-testid="logout-button"
            >
              <LogOut size={18} className="mr-2" />
              Sign Out
            </Button>
          </div>

          {/* App Info */}
          <div className="text-center text-sm text-muted-foreground space-y-1">
            <p>Bolpur Mart v1.0.0</p>
            <p>Made with ❤️ for quick commerce</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border z-50" data-testid="bottom-navigation">
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
            className="flex flex-col items-center p-2 text-muted-foreground"
            onClick={() => handleNavigation("/orders")}
            data-testid="nav-orders"
          >
            <Receipt size={20} />
            <span className="text-xs mt-1">Orders</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 text-primary"
            data-testid="nav-account"
          >
            <User size={20} />
            <span className="text-xs mt-1">Account</span>
          </Button>
        </div>
      </nav>
    </div>
  );
}
