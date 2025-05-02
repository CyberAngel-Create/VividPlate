import { createContext, ReactNode, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

type UseSubscriptionResult = {
  subscription: Subscription | null;
  isPaid: boolean;
  isLoading: boolean;
  error: Error | null;
};

const SubscriptionContext = createContext<UseSubscriptionResult | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const {
    data: subscription,
    isLoading,
    error,
  } = useQuery<Subscription | null>({
    queryKey: ["/api/subscription/current"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Don't fetch if user is not authenticated
    enabled: !!user,
    // Use placeholders if data isn't available yet
    placeholderData: null,
  });

  // Determine if user has a paid subscription
  const isPaid = Boolean(
    subscription && 
    subscription.isActive && 
    subscription.tier !== "free"
  );

  const value = {
    subscription: subscription || null,
    isPaid,
    isLoading,
    error: error as Error | null,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): UseSubscriptionResult {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}