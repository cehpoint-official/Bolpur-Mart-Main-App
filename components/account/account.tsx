"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInstallPrompt } from "@/components/pwa/install-prompt";
import { useAuth } from "@/hooks/use-auth";

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
  Edit,
  Phone,
  Mail,
  Calendar,
  LogOut,
  ArrowLeft,
  Camera,
  Upload,
  X,
  Loader2
} from "lucide-react";
import { FirebaseAuthService } from "@/lib/firebase-services";

const uploadImageToCloudinary = async (file: File) => {
  const cloudinaryData = new FormData()
  cloudinaryData.append("file", file)
  cloudinaryData.append("upload_preset", "Images")
  cloudinaryData.append("asset_folder", "UsersImage")
  cloudinaryData.append("cloud_name", "dqoo1d1ip")
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dqoo1d1ip/image/upload`,
    {
      method: 'POST',
      body: cloudinaryData,
    }
  )

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return data.secure_url
}

export default function Account() {
  const { user, updateUserData, signOut } = useAuth();
  const { installApp, canInstall } = useInstallPrompt();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAvatar = async () => {
    if (!user || !selectedFile) return;

    setIsUploading(true);
    try {
      // Upload new image
      const avatarUrl = await uploadImageToCloudinary(selectedFile);

      // Update user profile with only avatar
      const updatedData = {
        avatar: avatarUrl,
      };

      await FirebaseAuthService.updateUserProfile(updatedData);
      
      // Update local state
      updateUserData({
        ...user.customData,
        ...updatedData,
      });

      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });

      // Reset dialog state
      setIsDialogOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (error: any) {
      console.error("Error updating avatar:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
      action: () => toast({ title: "Coming Soon", description: "Profile editing feature is coming soon!" }),
      testId: "profile-menu"
    },
    {
      icon: MapPin,
      title: "Saved Addresses",
      description: "Manage delivery addresses",
      action: () => toast({ title: "Coming Soon", description: "Address management feature is coming soon!" }),
      testId: "addresses-menu"
    },
    {
      icon: CreditCard,
      title: "Payment Methods",
      description: "Cards, UPI, and wallets",
      action: () => toast({ title: "Coming Soon", description: "Payment methods feature is coming soon!" }),
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
    return  user?.customData?.avatar || 
           "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face";
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
                  <img
                    src={getUserAvatar()}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                    data-testid="profile-avatar"
                  />
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background shadow-lg hover:scale-105 transition-transform"
                        data-testid="edit-avatar"
                      >
                        <Camera size={14} />
                      </Button>
                    </DialogTrigger>
                    
                    <DialogContent className="sm:max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <Camera className="w-5 h-5 text-primary" />
                          <span className="text-sm">Update Profile Picture</span>
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-6">
                        {/* Avatar Upload Section */}
                        <div className="flex flex-col items-center space-y-4">
                          <div className="relative group">
                            <img
                              src={previewUrl || getUserAvatar()}
                              alt="Profile Preview"
                              className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                            />
                            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center space-y-3">
                            <div className="flex space-x-2">
                              <Label htmlFor="avatar-upload">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="cursor-pointer bg-primary/5 hover:bg-primary/10 border-primary/20" 
                                  asChild
                                >
                                  <span>
                                    <Upload className="w-4 h-4 mr-2" />
                                    Choose New Image
                                  </span>
                                </Button>
                              </Label>
                              <Input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                              />
                              {previewUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setPreviewUrl(null);
                                    setSelectedFile(null);
                                  }}
                                  className="hover:bg-red-50 hover:text-red-600"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                            
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">
                                Upload a new profile picture
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Max size: 5MB • Formats: JPG, PNG, WEBP
                              </p>
                            </div>
                          </div>
                        </div>

                        {selectedFile && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-green-800">
                                Image ready for upload
                              </span>
                            </div>
                            <p className="text-xs text-green-600 mt-1">
                              Click "Update Avatar" to save your new profile picture
                            </p>
                          </div>
                        )}
                      </div>

                      <DialogFooter className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false)
                            setSelectedFile(null)
                            setPreviewUrl(null)
                          }}
                          disabled={isUploading}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveAvatar}
                          disabled={isUploading || !selectedFile}
                          className="min-w-[120px]"
                        >
                          {isUploading ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Update Avatar
                            </>
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
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
