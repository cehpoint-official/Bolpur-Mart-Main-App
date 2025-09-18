import type { ReactNode } from "react"
 import { QueryClientProvider } from "@tanstack/react-query"
 import { queryClient } from "@/lib/queryClient"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    //  <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    //  </QueryClientProvider>
  )
}
