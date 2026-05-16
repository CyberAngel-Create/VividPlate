import { createContext, ReactNode, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Subscription } from "@shared/schema";
import { getQueryFn } from "@/lib/queryClient";
import { useAuth } from "./use-auth";

type UseSubscriptionResult = {
  subscription: Subscription | null;
  isPaid: boolean;
  isLoading: boolean;
  isSubscriptionLoading: boolean;
  error: Error | null;
};

const SubscriptionContext = createContext<UseSubscriptionResult | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();

  const {
    data: subscription,
    isLoading: isSubscriptionLoading,
    error,
  } = useQuery<Subscription | null>({
    queryKey: ["/api/subscription/current"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Don't fetch if user is not authenticated
    enabled: !!user,
    // Use placeholders if data isn't available yet
    placeholderData: null,
  });

  // Determine if user has a paid subscription with multiple fallback checks
  const isPaid = (() => {
    // First check: If no user, definitely not paid
    if (!user) return false;
    
    // Second check: If user object has subscription tier info directly
    if (user.subscriptionTier && user.subscriptionTier !== "free") {
      return true;
    }
    
    // Third check: If we have subscription data from the API
    return Boolean(
      subscription && 
      subscription.isActive && 
      subscription.tier !== "free"
    );
  })();

  const value = {
    subscription: subscription || null,
    isPaid,
    isLoading: isAuthLoading || isSubscriptionLoading,
    isSubscriptionLoading,
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