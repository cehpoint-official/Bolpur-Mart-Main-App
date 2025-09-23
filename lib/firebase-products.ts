// lib/firebase-products.ts
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Product, TimeRulesConfig, CategoryReference } from "@/types";

export class FirebaseProductService {
  // Fetch time rules configuration
  static async getTimeRules(): Promise<TimeRulesConfig | null> {
    try {
      console.log("Fetching time rules...");
      const timeRulesDoc = await getDoc(doc(db, "settings", "timeRules"));

      if (timeRulesDoc.exists()) {
        const data = timeRulesDoc.data() as TimeRulesConfig;
        console.log("Time rules fetched:", data);
        return data;
      } else {
        console.log("No time rules found");
        return null;
      }
    } catch (error) {
      console.error("Error fetching time rules:", error);
      return null;
    }
  }

  // Get current time slot based on current time
  static getCurrentTimeSlotId(timeRules: TimeRulesConfig): string | null {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;

    console.log("Current time:", currentTime);

    for (const [slotId, slot] of Object.entries(timeRules)) {
      if (!slot.isActive) continue;

      console.log(
        `Checking slot ${slot.timeSlotName}: ${slot.startTime} - ${slot.endTime}`
      );

      // Handle time slots that cross midnight (like 22:00 - 06:00)
      if (slot.startTime > slot.endTime) {
        // Crosses midnight
        if (currentTime >= slot.startTime || currentTime < slot.endTime) {
          console.log(`Found active slot: ${slot.timeSlotName}`);
          return slotId;
        }
      } else {
        // Same day time slot
        if (currentTime >= slot.startTime && currentTime < slot.endTime) {
          console.log(`Found active slot: ${slot.timeSlotName}`);
          return slotId;
        }
      }
    }

    console.log("No active time slot found");
    return null;
  }

  // Get allowed categories for current time slot
  static getAllowedCategories(
    timeRules: TimeRulesConfig,
    currentSlotId: string
  ): CategoryReference[] {
    const slot = timeRules[currentSlotId];
    if (!slot) {
      console.log("Slot not found:", currentSlotId);
      return [];
    }

    console.log("Allowed categories:", slot.allowedCategories);
    return slot.allowedCategories;
  }

  // Fetch products based on time slot and filters
static async getProducts(
  searchQuery?: string,
  categoryFilter?: string | string[]
): Promise<Product[]> {
  try {
    console.log("Fetching products...", { searchQuery, categoryFilter });

    // First get time rules
    const timeRules = await this.getTimeRules();
    if (!timeRules) {
      console.log("No time rules found, returning empty array");
      return [];
    }

    // Get current time slot
    const currentSlotId = this.getCurrentTimeSlotId(timeRules);
    if (!currentSlotId) {
      console.log("No active time slot, returning empty array");
      return [];
    }

    // Get allowed categories for current time slot
    const allowedCategories = this.getAllowedCategories(
      timeRules,
      currentSlotId
    );
    const allowedCategoryIds = allowedCategories.map((cat) => cat.id);

    console.log("Allowed category IDs:", allowedCategoryIds);

    // Build Firestore query
    let productsQuery = query(
      collection(db, "products"),
      where("available", "==", true)
    );

    // Execute query
    const querySnapshot = await getDocs(productsQuery);
    let products: Product[] = [];

    querySnapshot.forEach((doc) => {
      const productData = doc.data();
      const product: Product = {
        id: doc.id,
        ...productData,
      } as Product;

      // Filter by time slot categories
      const hasAllowedCategory = product.categories.some((category) =>
        allowedCategoryIds.includes(category.id)
      );

      if (!hasAllowedCategory) {
        console.log(
          `Product ${product.name} doesn't have allowed categories`
        );
        return;
      }

      // Apply search filter
      if (searchQuery && searchQuery.trim() !== "") {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower) ||
          product.tags.some((tag) =>
            tag.toLowerCase().includes(searchLower)
          ) ||
          product.categories.some((cat) =>
            cat.name.toLowerCase().includes(searchLower)
          );

        if (!matchesSearch) {
          console.log(
            `Product ${product.name} doesn't match search: ${searchQuery}`
          );
          return;
        }
      }

      // Apply category filter - Updated to support both single and multiple categories
      if (categoryFilter) {
        const categoryFilters = Array.isArray(categoryFilter) 
          ? categoryFilter 
          : [categoryFilter];
        
        // Filter out empty strings
        const validCategoryFilters = categoryFilters.filter(cat => cat.trim() !== "");
        
        if (validCategoryFilters.length > 0) {
          const hasSelectedCategory = product.categories.some(
            (cat) => validCategoryFilters.includes(cat.id)
          );
          
          if (!hasSelectedCategory) {
            console.log(
              `Product ${product.name} doesn't match category filter: ${JSON.stringify(validCategoryFilters)}`
            );
            return;
          }
        }
      }

      console.log(`Product ${product.name} matches all filters`);
      products.push(product);
    });

    console.log(`Returning ${products.length} products`);
    return products;
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}


  // Get categories available in current time slot
  static async getAvailableCategories(): Promise<CategoryReference[]> {
    try {
      const timeRules = await this.getTimeRules();
      if (!timeRules) {
        return [];
      }

      const currentSlotId = this.getCurrentTimeSlotId(timeRules);
      if (!currentSlotId) {
        console.log(" No active time slot");
        return [];
      }

      const allowedCategories = this.getAllowedCategories(
        timeRules,
        currentSlotId
      );

      return allowedCategories;
    } catch (error) {
      console.error(" Error fetching available categories:", error);
      return [];
    }
  }
  static async getProductById(productId: string): Promise<Product | null> {
    try {
      const productDoc = await getDoc(doc(db, "products", productId));
      if (!productDoc.exists()) {
        console.log(`Product with ID ${productId} not found`);
        return null;
      }
      const productData = productDoc.data();
      const product: Product = {
        id: productDoc.id,
        ...productData,
      } as Product;
      return product;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      return null;
    }
  }
}
