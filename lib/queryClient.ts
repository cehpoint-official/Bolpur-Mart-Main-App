import { QueryClient, QueryFunction } from "@tanstack/react-query"

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText
    throw new Error(`${res.status}: ${text}`)
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  init?: RequestInit
): Promise<Response> {
  // Ensure URL starts with /api for consistency
  const fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
    ...init,
  })

  await throwIfResNotOk(res)
  return res
}

type UnauthorizedBehavior = "returnNull" | "throw"

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Build URL from query key
    const url = Array.isArray(queryKey) ? queryKey.join("") : queryKey.toString()
    const fullUrl = url.startsWith("/api") ? url : `/api${url.startsWith("/") ? "" : "/"}${url}`
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    })

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null
    }

    await throwIfResNotOk(res)
    return await res.json()
  }

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.message?.includes("401") || error?.message?.includes("403")) {
          return false
        }
        return failureCount < 2
      },
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Don't retry mutations on client errors
        if (error?.message?.includes("4")) {
          return false
        }
        return failureCount < 1
      },
    },
  },
})

// Utility functions for common patterns
export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiRequest("GET", url)
  return response.json() as Promise<T>
}

export async function apiPost<T>(url: string, data?: any): Promise<T> {
  const response = await apiRequest("POST", url, data)
  return response.json() as Promise<T>
}

export async function apiPut<T>(url: string, data?: any): Promise<T> {
  const response = await apiRequest("PUT", url, data)
  return response.json() as Promise<T>
}

export async function apiDelete<T>(url: string): Promise<T> {
  const response = await apiRequest("DELETE", url)
  return response.json() as Promise<T>
}

// Error handling utility
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

// Export default for compatibility
export default { 
  apiRequest, 
  apiGet, 
  apiPost, 
  apiPut, 
  apiDelete, 
  queryClient, 
  getErrorMessage 
}
