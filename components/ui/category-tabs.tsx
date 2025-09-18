"use client"

import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, ShoppingBag, Coffee, Utensils, Apple, Package, Pill, Zap, Heart } from "lucide-react"
import { useTimeSlot } from "@/hooks/use-time-slot"
import type { Category } from "@/types"

interface CategoryTabsProps {
  selectedCategory?: string
  onCategorySelect: (categoryId: string) => void
}

const categoryIcons: Record<string, any> = {
  vegetables: Apple,
  groceries: Package,
  medicine: Pill,
  snacks: Coffee,
  biryani: Utensils,
  "evening-food": Utensils,
  fruits: Apple,
  dairy: Package,
  beverages: Coffee,
  pharmacy: Pill,
  bakery: Coffee,
  meat: Package,
  seafood: Package,
  organic: Heart,
  instant: Zap,
  default: ShoppingBag,
}

const timeSlotNames = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
}

const getAvailableTime = (currentTimeSlot: string, category: Category) => {
  const timeSlots = Array.isArray(category.timeSlots) ? category.timeSlots : []
  if (timeSlots.includes(currentTimeSlot as any)) return "Available Now"

  if (currentTimeSlot === "morning" && timeSlots.includes("afternoon")) return "Available 12 PM"
  if (currentTimeSlot === "morning" && timeSlots.includes("evening")) return "Available 6 PM"
  if (currentTimeSlot === "afternoon" && timeSlots.includes("evening")) return "Available 6 PM"
  if (currentTimeSlot === "afternoon" && timeSlots.includes("morning")) return "Available 6 AM"
  if (currentTimeSlot === "evening" && timeSlots.includes("morning")) return "Available 6 AM"
  if (currentTimeSlot === "evening" && timeSlots.includes("afternoon")) return "Available 12 PM"

  return "Coming Soon"
}

export function CategoryTabs({ selectedCategory, onCategorySelect }: CategoryTabsProps) {
  const { currentTimeSlot } = useTimeSlot()

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories/timeslot", currentTimeSlot],
  })

  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  })

  const availableCategoryIds = categories.map((cat) => cat.id)

  return (
    <div className="px-4 mb-6" data-testid="category-tabs">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {allCategories.map((category) => {
          const isAvailable = availableCategoryIds.includes(category.id)
          const isSelected = selectedCategory === category.id
          const IconComponent = categoryIcons[category.slug] || categoryIcons.default
          const availableTime = getAvailableTime(currentTimeSlot, category)

          return (
            <Card
              key={category.id}
              className={`
                cursor-pointer transition-all duration-200 hover:shadow-md
                ${isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-muted/50"}
                ${!isAvailable && "opacity-60"}
              `}
              onClick={() => isAvailable && onCategorySelect(category.id)}
              data-testid={`category-card-${category.slug}`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div
                    className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-colors
                    ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isAvailable
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                    }
                  `}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-medium text-sm">{category.name}</h3>
                    <div className="flex items-center justify-center mt-1">
                      <Clock className="w-3 h-3 mr-1 text-muted-foreground" />
                      <span
                        className={`
                        text-xs
                        ${isAvailable ? "text-green-600 font-medium" : "text-muted-foreground"}
                      `}
                      >
                        {availableTime}
                      </span>
                    </div>
                  </div>

                  {isAvailable && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      15-20 min
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
