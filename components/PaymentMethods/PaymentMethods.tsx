"use client";

import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Smartphone,
  Building,
  Wallet,
  Loader2
} from "lucide-react";
import type { PaymentMethod } from "@/types";

// Mock payment methods data
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: "1",
    type: "card",
    name: "HDFC Credit Card",
    details: "**** **** **** 1234",
    isDefault: true,
    lastUsed: "2024-01-15",
    cardNumber: "1234567812345678",
    expiryMonth: "12",
    expiryYear: "2028",
    cardHolderName: "John Doe",
    cardType: "visa"
  },
  {
    id: "2",
    type: "upi",
    name: "Google Pay",
    details: "john@okaxis",
    isDefault: false,
    lastUsed: "2024-01-10",
    upiId: "john@okaxis"
  },
  {
    id: "3",
    type: "wallet",
    name: "Paytm Wallet",
    details: "Balance: ₹2,500",
    isDefault: false,
    lastUsed: "2024-01-08",
    walletProvider: "Paytm",
    walletBalance: 2500
  }
];

const initialPaymentForm = {
  type: "card" as 'card' | 'upi' | 'netbanking' | 'wallet',
  name: "",
  cardNumber: "",
  expiryMonth: "",
  expiryYear: "",
  cardHolderName: "",
  cardType: "visa" as 'visa' | 'mastercard' | 'rupay',
  upiId: "",
  walletProvider: ""
};

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setPaymentForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setPaymentForm(initialPaymentForm);
    setIsDialogOpen(true);
  };

  const handleEditPayment = (payment: PaymentMethod) => {
    setEditingPayment(payment);
    setPaymentForm({
      type: payment.type,
      name: payment.name,
      cardNumber: payment.cardNumber || "",
      expiryMonth: payment.expiryMonth || "",
      expiryYear: payment.expiryYear || "",
      cardHolderName: payment.cardHolderName || "",
      cardType: payment.cardType || "visa",
      upiId: payment.upiId || "",
      walletProvider: payment.walletProvider || ""
    });
    setIsDialogOpen(true);
  };

  const formatCardNumber = (cardNumber: string) => {
    return cardNumber.replace(/(.{4})/g, '$1 ').trim();
  };

  const maskCardNumber = (cardNumber: string) => {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  };

  const handleSavePayment = async () => {
    let isValid = false;
    let details = "";
    
    switch (paymentForm.type) {
      case 'card':
        isValid = !!(paymentForm.name && paymentForm.cardNumber && paymentForm.expiryMonth && paymentForm.expiryYear && paymentForm.cardHolderName);
        details = maskCardNumber(paymentForm.cardNumber);
        break;
      case 'upi':
        isValid = !!(paymentForm.name && paymentForm.upiId);
        details = paymentForm.upiId;
        break;
      case 'wallet':
        isValid = !!(paymentForm.name && paymentForm.walletProvider);
        details = `Balance: ₹0`;
        break;
      case 'netbanking':
        isValid = !!paymentForm.name;
        details = "Net Banking";
        break;
    }

    if (!isValid) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newPayment: PaymentMethod = {
        id: editingPayment?.id || Date.now().toString(),
        type: paymentForm.type,
        name: paymentForm.name,
        details,
        isDefault: editingPayment?.isDefault || paymentMethods.length === 0,
        lastUsed: new Date().toISOString().split('T')[0],
        ...(paymentForm.type === 'card' && {
          cardNumber: paymentForm.cardNumber,
          expiryMonth: paymentForm.expiryMonth,
          expiryYear: paymentForm.expiryYear,
          cardHolderName: paymentForm.cardHolderName,
          cardType: paymentForm.cardType
        }),
        ...(paymentForm.type === 'upi' && {
          upiId: paymentForm.upiId
        }),
        ...(paymentForm.type === 'wallet' && {
          walletProvider: paymentForm.walletProvider,
          walletBalance: 0
        })
      };

      if (editingPayment) {
        setPaymentMethods(prev => prev.map(payment => 
          payment.id === editingPayment.id ? newPayment : payment
        ));
        toast({
          title: "Payment Method Updated",
          description: "Your payment method has been updated successfully.",
        });
      } else {
        setPaymentMethods(prev => [...prev, newPayment]);
        toast({
          title: "Payment Method Added",
          description: "New payment method has been added successfully.",
        });
      }

      setIsDialogOpen(false);
      setPaymentForm(initialPaymentForm);
      setEditingPayment(null);
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save payment method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    try {
      const paymentToDelete = paymentMethods.find(payment => payment.id === paymentId);
      if (paymentToDelete?.isDefault && paymentMethods.length > 1) {
        // Set another payment as default
        const otherPayments = paymentMethods.filter(payment => payment.id !== paymentId);
        setPaymentMethods(prev => prev.map(payment => 
          payment.id === otherPayments[0].id 
            ? { ...payment, isDefault: true }
            : payment.id === paymentId 
            ? null 
            : payment
        ).filter(Boolean) as PaymentMethod[]);
      } else {
        setPaymentMethods(prev => prev.filter(payment => payment.id !== paymentId));
      }
      
      toast({
        title: "Payment Method Deleted",
        description: "Payment method has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete payment method. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = (paymentId: string) => {
    setPaymentMethods(prev => prev.map(payment => ({
      ...payment,
      isDefault: payment.id === paymentId
    })));
    
    toast({
      title: "Default Payment Set",
      description: "This payment method is now your default.",
    });
  };

  const getPaymentIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard size={20} className="text-blue-600" />;
      case 'upi':
        return <Smartphone size={20} className="text-green-600" />;
      case 'netbanking':
        return <Building size={20} className="text-purple-600" />;
      case 'wallet':
        return <Wallet size={20} className="text-orange-600" />;
      default:
        return <CreditCard size={20} className="text-gray-600" />;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'card':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'upi':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'netbanking':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'wallet':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderPaymentForm = () => {
    switch (paymentForm.type) {
      case 'card':
        return (
          <>
            <div>
              <Label htmlFor="cardName">Card Name *</Label>
              <Input
                id="cardName"
                value={paymentForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="HDFC Credit Card"
              />
            </div>
            
            <div>
              <Label htmlFor="cardNumber">Card Number *</Label>
              <Input
                id="cardNumber"
                value={paymentForm.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value.replace(/\s/g, ''))}
                placeholder="1234 5678 9012 3456"
                maxLength={16}
              />
            </div>

            <div>
              <Label htmlFor="cardHolderName">Card Holder Name *</Label>
              <Input
                id="cardHolderName"
                value={paymentForm.cardHolderName}
                onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="expiryMonth">Month *</Label>
                <Select
                  value={paymentForm.expiryMonth}
                  onValueChange={(value) => handleInputChange('expiryMonth', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1).padStart(2, '0')}>
                        {String(i + 1).padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="expiryYear">Year *</Label>
                <Select
                  value={paymentForm.expiryYear}
                  onValueChange={(value) => handleInputChange('expiryYear', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="YYYY" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => (
                      <SelectItem key={i} value={String(new Date().getFullYear() + i)}>
                        {new Date().getFullYear() + i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cardType">Type</Label>
                <Select
                  value={paymentForm.cardType}
                  onValueChange={(value) => handleInputChange('cardType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visa">Visa</SelectItem>
                    <SelectItem value="mastercard">MasterCard</SelectItem>
                    <SelectItem value="rupay">RuPay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        );

      case 'upi':
        return (
          <>
            <div>
              <Label htmlFor="upiName">UPI Name *</Label>
              <Input
                id="upiName"
                value={paymentForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Google Pay"
              />
            </div>
            
            <div>
              <Label htmlFor="upiId">UPI ID *</Label>
              <Input
                id="upiId"
                value={paymentForm.upiId}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                placeholder="john@okaxis"
              />
            </div>
          </>
        );

      case 'wallet':
        return (
          <>
            <div>
              <Label htmlFor="walletName">Wallet Name *</Label>
              <Input
                id="walletName"
                value={paymentForm.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Paytm Wallet"
              />
            </div>
            
            <div>
              <Label htmlFor="walletProvider">Provider *</Label>
              <Select
                value={paymentForm.walletProvider}
                onValueChange={(value) => handleInputChange('walletProvider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paytm">Paytm</SelectItem>
                  <SelectItem value="PhonePe">PhonePe</SelectItem>
                  <SelectItem value="Amazon Pay">Amazon Pay</SelectItem>
                  <SelectItem value="Mobikwik">Mobikwik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'netbanking':
        return (
          <div>
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              value={paymentForm.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="HDFC Bank"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MobileLayout 
      title="Payment Methods" 
      subtitle="Manage your payment options"
      backPath="/account"
    >
      <div className="p-4 space-y-4">
        {/* Add Payment Button */}
        <Button
          className="w-full"
          onClick={handleAddPayment}
        >
          <Plus size={16} className="mr-2" />
          Add Payment Method
        </Button>

        {/* Payment Methods List */}
        <div className="space-y-3">
          {paymentMethods.map((payment) => (
            <Card key={payment.id} className="mobile-card-hover">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Payment Type and Default Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getPaymentIcon(payment.type)}
                      <div>
                        <h3 className="font-medium">{payment.name}</h3>
                        <p className="text-sm text-muted-foreground">{payment.details}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {payment.isDefault && (
                        <Badge className="bg-primary/10 text-primary border-primary/20">
                          <Star size={12} className="mr-1" />
                          Default
                        </Badge>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleEditPayment(payment)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeletePayment(payment.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Type Badge */}
                  <div className="flex items-center justify-between">
                    <Badge className={`capitalize ${getPaymentTypeColor(payment.type)}`}>
                      {payment.type === 'netbanking' ? 'Net Banking' : payment.type}
                    </Badge>
                    
                    {payment.lastUsed && (
                      <span className="text-xs text-muted-foreground">
                        Last used: {new Date(payment.lastUsed).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Set as Default Button */}
                  {!payment.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleSetDefault(payment.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {paymentMethods.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Payment Methods</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first payment method to make checkout faster
              </p>
              <Button onClick={handleAddPayment}>
                <Plus size={16} className="mr-2" />
                Add Payment Method
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Payment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPayment ? "Edit Payment Method" : "Add Payment Method"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Payment Type */}
              <div>
                <Label htmlFor="type">Payment Type</Label>
                <Select
                  value={paymentForm.type}
                  onValueChange={(value) => handleInputChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="wallet">Digital Wallet</SelectItem>
                    <SelectItem value="netbanking">Net Banking</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {renderPaymentForm()}
            </div>

            <DialogFooter className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSavePayment}
                disabled={isSaving}
                className="min-w-[100px]"
              >
                {isSaving ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  editingPayment ? "Update" : "Save"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
}