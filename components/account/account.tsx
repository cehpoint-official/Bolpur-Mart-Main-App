import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useInstallPrompt } from "@/components/pwa/install-prompt";
import { 
  Home,
  Search,
  Receipt,
  User,
  Settings,
  MapPin,
  CreditCard,
  Heart,
  HelpCircle,
  Shield,
  Bell,
  Smartphone,
  ChevronRight,
  Edit,
  Phone,
  Mail,
  Calendar,
  LogOut
} from "lucide-react";

export default function Account() {
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
            alert('Notifications enabled! You\'ll receive updates about your orders.');
          }
        });
      } else if (Notification.permission === 'granted') {
        alert('Notifications are already enabled.');
      } else {
        alert('Notifications are blocked. Please enable them in your browser settings.');
      }
    } else {
      alert('Notifications are not supported in this browser.');
    }
  };

  const menuItems = [
    {
      icon: User,
      title: "Profile Information",
      description: "Update your personal details",
      action: () => alert("Profile settings coming soon!"),
      testId: "profile-menu"
    },
    {
      icon: MapPin,
      title: "Saved Addresses",
      description: "Manage delivery addresses",
      action: () => alert("Address management coming soon!"),
      testId: "addresses-menu"
    },
    {
      icon: CreditCard,
      title: "Payment Methods",
      description: "Cards, UPI, and wallets",
      action: () => alert("Payment methods coming soon!"),
      testId: "payment-menu"
    },
    {
      icon: Heart,
      title: "Wishlist",
      description: "Your favorite items",
      action: () => alert("Wishlist feature coming soon!"),
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
      testId: "install-app-menu"
    },
    {
      icon: HelpCircle,
      title: "Help & Support",
      description: "FAQs and customer support",
      action: () => alert("Help & Support: Contact us at support@bolpurmart.com or call +91 98765 43210"),
      testId: "help-menu"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Data protection settings",
      action: () => alert("Privacy & Security settings coming soon!"),
      testId: "privacy-menu"
    }
  ];

  const handleLogout = () => {
    // Clear any stored user data
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    // Redirect to home
    window.location.href = '/';
  };

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border" data-testid="account-header">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="font-bold text-xl">Account</h1>
            <p className="text-sm text-muted-foreground">
              Manage your profile and preferences
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            data-testid="account-settings"
          >
            <Settings size={20} />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Profile Section */}
        <div className="p-4">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face"
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                    data-testid="profile-avatar"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background"
                    data-testid="edit-avatar"
                  >
                    <Edit size={12} />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-semibold text-lg" data-testid="user-name">
                    John Doe
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail size={14} className="mr-2" />
                      john.doe@example.com
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone size={14} className="mr-2" />
                      +91 98765 43210
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar size={14} className="mr-2" />
                      Member since Jan 2024
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
                <div className="text-2xl font-bold text-primary">12</div>
                <div className="text-xs text-muted-foreground">Orders</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">₹2,340</div>
                <div className="text-xs text-muted-foreground">Saved</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary">5</div>
                <div className="text-xs text-muted-foreground">Favorites</div>
              </CardContent>
            </Card>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <Button
                    variant="ghost"
                    className="w-full h-auto p-4 flex items-center justify-between"
                    onClick={item.action}
                    data-testid={item.testId}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <item.icon className="text-primary" size={20} />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium">{item.title}</h4>
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
              className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
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
