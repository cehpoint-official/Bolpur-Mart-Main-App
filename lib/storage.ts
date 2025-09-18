import { eq, like, and, or, desc, asc } from 'drizzle-orm';
import { db, executeQuery } from './db';
import type {
  User,
  InsertUser,
  Category,
  InsertCategory,
  Product,
  InsertProduct,
  CartItem,
  InsertCartItem,
  Order,
  InsertOrder,
  WishlistItem,
  InsertWishlistItem,
  Recommendation,
  InsertRecommendation,
  TimeSlotType,
} from '@/shared/schema';
import * as schema from '@/shared/schema';

class Storage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    return executeQuery(async () => {
      const users = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
      return users[0];
    });
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return executeQuery(async () => {
      const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
      return users[0];
    });
  }

  async createUser(user: InsertUser): Promise<User> {
    return executeQuery(async () => {
      const [newUser] = await db.insert(schema.users).values(user).returning();
      return newUser;
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    return executeQuery(async () => {
      const [updatedUser] = await db
        .update(schema.users)
        .set(updates)
        .where(eq(schema.users.id, id))
        .returning();
      return updatedUser;
    });
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return executeQuery(async () => {
      return await db.select().from(schema.categories).orderBy(asc(schema.categories.sortOrder));
    });
  }

  async getCategoriesByTimeSlot(timeSlot: TimeSlotType): Promise<Category[]> {
    return executeQuery(async () => {
      // This is a simplified approach - in a real app, you might need a more complex query
      // to check if the timeSlot is in the timeSlots array
      const allCategories = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.isActive, true))
        .orderBy(asc(schema.categories.sortOrder));
      
      return allCategories.filter(category => {
        const timeSlots = category.timeSlots as string[];
        return timeSlots.includes(timeSlot);
      });
    });
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return executeQuery(async () => {
      const categories = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
      return categories[0];
    });
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    return executeQuery(async () => {
      const [newCategory] = await db.insert(schema.categories).values(category).returning();
      return newCategory;
    });
  }

  // Products
  async getProducts(): Promise<Product[]> {
    return executeQuery(async () => {
      return await db.select().from(schema.products).where(eq(schema.products.isActive, true));
    });
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return executeQuery(async () => {
      return await db
        .select()
        .from(schema.products)
        .where(and(eq(schema.products.categoryId, categoryId), eq(schema.products.isActive, true)));
    });
  }

  async getProductsByTimeSlot(timeSlot: TimeSlotType): Promise<Product[]> {
    return executeQuery(async () => {
      // First get categories for this time slot
      const categories = await this.getCategoriesByTimeSlot(timeSlot);
      const categoryIds = categories.map(c => c.id);
      
      // Then get products for these categories
      if (categoryIds.length === 0) return [];
      
      return await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.isActive, true),
            // Check if product's categoryId is in the list of category IDs
            // This is a simplified approach
            or(...categoryIds.map(id => eq(schema.products.categoryId, id)))
          )
        );
    });
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return executeQuery(async () => {
      const products = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
      return products[0];
    });
  }

  async searchProducts(query: string): Promise<Product[]> {
    return executeQuery(async () => {
      const searchTerm = `%${query.toLowerCase()}%`;
      return await db
        .select()
        .from(schema.products)
        .where(
          and(
            eq(schema.products.isActive, true),
            or(
              like(schema.products.name, searchTerm),
              like(schema.products.description, searchTerm)
            )
          )
        );
    });
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return executeQuery(async () => {
      const [newProduct] = await db.insert(schema.products).values(product).returning();
      return newProduct;
    });
  }

  // Cart
  async getCartItems(userId: string): Promise<CartItem[]> {
    return executeQuery(async () => {
      return await db.select().from(schema.cart).where(eq(schema.cart.userId, userId));
    });
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    return executeQuery(async () => {
      // Check if item already exists in cart
      const existingItems = await db
        .select()
        .from(schema.cart)
        .where(
          and(
            eq(schema.cart.userId, item.userId),
            eq(schema.cart.productId, item.productId)
          )
        );

      if (existingItems.length > 0) {
        // Update quantity if item exists
        const existingItem = existingItems[0];
        const newQuantity = existingItem.quantity + (item.quantity || 1);
        const [updatedItem] = await db
          .update(schema.cart)
          .set({ quantity: newQuantity })
          .where(eq(schema.cart.id, existingItem.id))
          .returning();
        return updatedItem;
      } else {
        // Insert new item
        const [newItem] = await db.insert(schema.cart).values(item).returning();
        return newItem;
      }
    });
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    return executeQuery(async () => {
      if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        await db.delete(schema.cart).where(eq(schema.cart.id, id));
        return undefined;
      } else {
        // Update quantity
        const [updatedItem] = await db
          .update(schema.cart)
          .set({ quantity })
          .where(eq(schema.cart.id, id))
          .returning();
        return updatedItem;
      }
    });
  }

  async removeFromCart(id: string): Promise<boolean> {
    return executeQuery(async () => {
      await db.delete(schema.cart).where(eq(schema.cart.id, id));
      return true;
    });
  }

  async clearCart(userId: string): Promise<boolean> {
    return executeQuery(async () => {
      await db.delete(schema.cart).where(eq(schema.cart.userId, userId));
      return true;
    });
  }

  // Orders
  async getOrders(userId: string): Promise<Order[]> {
    return executeQuery(async () => {
      return await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.userId, userId))
        .orderBy(desc(schema.orders.createdAt));
    });
  }

  async getOrder(id: string): Promise<Order | undefined> {
    return executeQuery(async () => {
      const orders = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
      return orders[0];
    });
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    return executeQuery(async () => {
      const [newOrder] = await db.insert(schema.orders).values(order).returning();
      return newOrder;
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    return executeQuery(async () => {
      const [updatedOrder] = await db
        .update(schema.orders)
        .set({ status })
        .where(eq(schema.orders.id, id))
        .returning();
      return updatedOrder;
    });
  }

  // Wishlist
  async getWishlistItems(userId: string): Promise<WishlistItem[]> {
    return executeQuery(async () => {
      return await db.select().from(schema.wishlist).where(eq(schema.wishlist.userId, userId));
    });
  }

  async addToWishlist(item: InsertWishlistItem): Promise<WishlistItem> {
    return executeQuery(async () => {
      // Check if item already exists in wishlist
      const existingItems = await db
        .select()
        .from(schema.wishlist)
        .where(
          and(
            eq(schema.wishlist.userId, item.userId),
            eq(schema.wishlist.productId, item.productId)
          )
        );

      if (existingItems.length > 0) {
        // Item already exists, return it
        return existingItems[0];
      } else {
        // Insert new item
        const [newItem] = await db.insert(schema.wishlist).values(item).returning();
        return newItem;
      }
    });
  }

  async removeFromWishlist(id: string): Promise<boolean> {
    return executeQuery(async () => {
      await db.delete(schema.wishlist).where(eq(schema.wishlist.id, id));
      return true;
    });
  }

  async clearWishlist(userId: string): Promise<boolean> {
    return executeQuery(async () => {
      await db.delete(schema.wishlist).where(eq(schema.wishlist.userId, userId));
      return true;
    });
  }

  // Recommendations
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    return executeQuery(async () => {
      return await db.select().from(schema.recommendations).where(eq(schema.recommendations.userId, userId));
    });
  }

  async saveRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    return executeQuery(async () => {
      const [newRecommendation] = await db.insert(schema.recommendations).values(recommendation).returning();
      return newRecommendation;
    });
  }

  async clearRecommendations(userId: string): Promise<boolean> {
    return executeQuery(async () => {
      await db.delete(schema.recommendations).where(eq(schema.recommendations.userId, userId));
      return true;
    });
  }
}

export const storage = new Storage();