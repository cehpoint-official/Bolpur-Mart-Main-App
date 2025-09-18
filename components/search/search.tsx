"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation" // ✅ Next.js navigation
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ProductCard } from "@/components/ui/product-card"
import { FloatingCart } from "@/components/ui/floating-cart"
import { CartModal } from "@/components/ui/cart-modal"
import { SearchIcon, ArrowLeft, SlidersHorizontal, X, Home, ClipboardList, User } from "lucide-react"
import type { Product } from "@/types" // ✅ Ensure correct schema path

export default function Search() {
  const router = useRouter() // ✅ Next.js navigation

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const userId = "mock-user-id"

  // ✅ Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ✅ Fetch search suggestions
  const { data: searchSuggestions = [] } = useQuery<string[]>({
    queryKey: ["/api/search/suggestions", searchQuery],
    enabled: searchQuery.length > 2,
  })

  // ✅ Fetch search results
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", "search", debouncedQuery],
    enabled: debouncedQuery.length > 0,
    queryFn: async () => {
      const response = await fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}`)
      return response.json()
    },
  })

  useEffect(() => {
    if (searchSuggestions && searchSuggestions.length > 0) {
      setSuggestions(searchSuggestions)
    }
  }, [searchSuggestions])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    setShowSuggestions(value.length > 0)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setDebouncedQuery("")
    setShowSuggestions(false)
  }

  const handleNavigation = (path: string) => {
    router.push(path) // ✅ Next.js router push
  }

  const handleCheckout = () => {
    router.push("/checkout") // ✅ Next.js router push
  }

  return (
    <div className="mobile-container">
      {/* Search Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border" data-testid="search-header">
        <div className="flex items-center p-4 space-x-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")} data-testid="back-button">
            <ArrowLeft size={20} />
          </Button>

          <div className="flex-1 relative">
            <SearchIcon
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              size={18}
            />
            <Input
              type="text"
              placeholder="Search for products..."
              className="pl-10 pr-10 bg-muted/50"
              value={searchQuery}
              onChange={handleSearch}
              data-testid="search-input"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                onClick={clearSearch}
                data-testid="clear-search"
              >
                <X size={16} />
              </Button>
            )}
          </div>

          <Button variant="ghost" size="icon" data-testid="search-filters">
            <SlidersHorizontal size={20} />
          </Button>
        </div>

        {/* Search Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-background border-b border-border shadow-lg z-40 max-w-md mx-auto">
            <div className="p-2">
              {suggestions.slice(0, 5).map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-3 text-left"
                  onClick={() => handleSuggestionClick(suggestion)}
                  data-testid={`suggestion-${index}`}
                >
                  <SearchIcon size={16} className="mr-3 text-muted-foreground" />
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* Search Results */}
        {debouncedQuery ? (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-lg">Search Results</h2>
                <p className="text-sm text-muted-foreground">
                  {isLoading ? "Searching..." : `${products.length} items found for "${debouncedQuery}"`}
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-card rounded-xl p-3 border border-border">
                    <div className="skeleton w-full h-32 rounded-lg mb-2"></div>
                    <div className="skeleton-text mb-1"></div>
                    <div className="skeleton-text w-3/4 mb-2"></div>
                    <div className="flex justify-between items-center">
                      <div className="skeleton-text w-1/3"></div>
                      <div className="skeleton w-8 h-8 rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="text-muted-foreground" size={32} />
                </div>
                <h3 className="font-semibold mb-2">No products found</h3>
                <p className="text-muted-foreground text-sm">Try searching with different keywords</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} userId={userId} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Search Landing */
          <div className="p-4">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="text-primary" size={32} />
              </div>
              <h3 className="font-semibold mb-2">Discover Products</h3>
              <p className="text-muted-foreground text-sm mb-6">Search for biryani, vegetables, medicines, and more</p>
            </div>

            {/* Popular Searches */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Popular Searches</h3>
              <div className="flex flex-wrap gap-2">
                {["Chicken Biryani", "Fresh Vegetables", "Paracetamol", "Samosa", "Orange Juice", "Rasgulla"].map(
                  (term) => (
                    <Badge
                      key={term}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => {
                        setSearchQuery(term)
                        setShowSuggestions(false)
                      }}
                      data-testid={`popular-search-${term.toLowerCase().replace(" ", "-")}`}
                    >
                      {term}
                    </Badge>
                  )
                )}
              </div>
            </div>

            {/* Recent Searches - Placeholder */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Recent Searches</h3>
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm">Your recent searches will appear here</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Cart */}
      <FloatingCart userId={userId} onOpenCart={() => setIsCartOpen(true)} />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border z-50">
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
          <Button variant="ghost" className="flex flex-col items-center p-2 text-primary" data-testid="nav-search">
            <SearchIcon size={20} />
            <span className="text-xs mt-1">Search</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 text-muted-foreground"
            onClick={() => handleNavigation("/orders")}
            data-testid="nav-orders"
          >
            <ClipboardList size={20} />
            <span className="text-xs mt-1">Orders</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center p-2 text-muted-foreground"
            onClick={() => handleNavigation("/account")}
            data-testid="nav-account"
          >
            <User size={20} />
            <span className="text-xs mt-1">Account</span>
          </Button>
        </div>
      </nav>

      {/* Cart Modal */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} userId={userId} />
    </div>
  )
}
