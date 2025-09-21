// Base Firebase document interface
export interface FirebaseDocument {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// User interface with additional Firebase-specific fields
export interface User extends FirebaseDocument {
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  addresses: Address[];
  preferences: UserPreferences;
  
  // Additional Firebase fields
  emailVerified?: boolean;
  profileCompleted?: boolean;
  authProvider?: 'email' | 'google';
  lastLoginAt?: string;
  lastLogoutAt?: string;
}

export interface Address {
  id: string;
  type: 'home' | 'work' | 'other';
  receiverName: string;
  receiverPhone: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  fullAddress: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'upi' | 'netbanking' | 'wallet';
  name: string;
  details: string;
  isDefault: boolean;
  lastUsed?: string;
  // Card specific fields
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardHolderName?: string;
  cardType?: 'visa' | 'mastercard' | 'rupay';
  // UPI specific fields
  upiId?: string;
  // Wallet specific fields
  walletProvider?: string;
  walletBalance?: number;
}



export interface UserPreferences {
  notifications: boolean;
  theme: 'light' | 'dark';
  language: string;
  currency: string;
}

// // Category interface
// export interface Category extends FirebaseDocument {
//   name: string;
//   slug: string;
//   description?: string;
//   image?: string;
//   timeSlots: TimeSlotType[];
//   isActive: boolean;
//   sortOrder: number;
// }

// // Product interface
// export interface Product {
//   id: string
//   name: string
//   categories: string[]
//   price: number
//   stock: number
//   vendorIds: string[]
//   vendorName: string
//   timeSlotIds: string[]
//   description: string
//   tags: string[]
//   available: boolean
//   createdAt?: Date
//   updatedAt?: Date
//   imageUrl?: string
// }


export interface ProductVariant {
  id: string;
  name: string;
  price: string;
  stock: number;
  attributes: Record<string, string>;
}

// Cart interface
export interface CartItem extends FirebaseDocument {
  userId: string;
  productId: string;
  quantity: number;
  variant?: string;
}

// Extended cart item with product details
export interface CartItemWithProduct extends CartItem {
  product: Product;
}

// Order interface
export interface Order extends FirebaseDocument {
  userId: string;
  items: OrderItem[];
  totalAmount: string;
  deliveryAddress: Address;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  estimatedDelivery?: string;
  deliveryPersonId?: string;
  notes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: string;
  variant?: string;
}

// Wishlist interface
export interface WishlistItem extends FirebaseDocument {
  userId: string;
  productId: string;
}

// Recommendation interface
export interface Recommendation extends FirebaseDocument {
  userId: string;
  productId: string;
  score: string;
  reason?: string;
}

// Enums and Types
export type TimeSlotType = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeSlotInfo {
  label: string;
  time: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
}

export type OrderStatus = 
  | 'placed' 
  | 'confirmed' 
  | 'preparing' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
// Update your existing types with these additions


export interface Category {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface CategoryReference {
  id: string
  name: string
}

export interface TimeSlot {
  id: string
  name: string
  label: string
  icon: string
  startTime: string // Format: "HH:MM"
  endTime: string // Format: "HH:MM"
  isActive: boolean
  order: number // For sorting
  createdAt?: Date
  updatedAt?: Date
}

export interface TimeRuleSlot {
  timeSlotName: string
  startTime: string
  endTime: string
  allowedCategories: CategoryReference[]
  isActive: boolean
}

export interface TimeRulesConfig {
  [timeSlotId: string]: TimeRuleSlot
}

export interface Vendor {
  id: string
  name: string
  location: string
  commission: number
  category: string[]
  contactPerson: string
  phone: string
  email: string
  address: string
  isActive: boolean
  createdAt?: Date
  updatedAt?: Date
  totalProducts: number
  totalOrders: number
  rating: number
}

export interface Product {
  id: string
  name: string
  categories: Category[]
  price: number // Original price
  discountedPrice?: number // Optional - only exists when hasDiscount is true
  discountPercentage?: number // Optional - only exists when hasDiscount is true
  hasDiscount: boolean // Whether product has discount or not
  stock: number
  vendors: Vendor[]
  description: string
  tags: string[]
  available: boolean
  createdAt?: Date
  updatedAt?: Date
  imageUrl?: string
  // Rating fields
  averageRating: number
  totalRatings: number
  ratingBreakdown: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}



// Input types (for creating documents without id and timestamps)
export type CreateUser = Omit<User, keyof FirebaseDocument>;
export type CreateCategory = Omit<Category, keyof FirebaseDocument>;
export type CreateProduct = Omit<Product, keyof FirebaseDocument>;
export type CreateCartItem = Omit<CartItem, keyof FirebaseDocument>;
export type CreateOrder = Omit<Order, keyof FirebaseDocument>;
export type CreateWishlistItem = Omit<WishlistItem, keyof FirebaseDocument>;
export type CreateRecommendation = Omit<Recommendation, keyof FirebaseDocument>;

// Update types (partial updates)
export type UpdateUser = Partial<CreateUser>;
export type UpdateCategory = Partial<CreateCategory>;
export type UpdateProduct = Partial<CreateProduct>;
export type UpdateCartItem = Partial<CreateCartItem>;
export type UpdateOrder = Partial<CreateOrder>;
export type UpdateWishlistItem = Partial<CreateWishlistItem>;
export type UpdateRecommendation = Partial<CreateRecommendation>;
