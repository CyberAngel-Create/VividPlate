import { createContext, ReactNode, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

// Subscription status interface
export interface SubscriptionStatus {
  tier: string;
  isPaid: boolean;
  maxRestaurants: number;
  currentRestaurants: number;
  expiresAt: string | null;
}

type UseSubscriptionStatusResult = {
  subscriptionStatus: SubscriptionStatus | null;
  isLoading: boolean;
  error: Error | null;
  canCreateRestaurant: boolean;
  restaurantsRemaining: number;
};

const defaultSubscriptionStatus: SubscriptionStatus = {
  tier: "free",
  isPaid: false,
  maxRestaurants: 1,
  currentRestaurants: 0,
  expiresAt: null
};

const SubscriptionStatusContext = createContext<UseSubscriptionStatusResult | null>(null);

export function SubscriptionStatusProvider({ children }: { children: ReactNode }) {
  const {
    data: subscriptionStatus,
    isLoading,
    error,
  } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/user/subscription-status'],
  });

  // Calculate if user can create a restaurant
  const status = subscriptionStatus || defaultSubscriptionStatus;
  const canCreateRestaurant = status.currentRestaurants < status.maxRestaurants;
  const restaurantsRemaining = Math.max(0, status.maxRestaurants - status.currentRestaurants);

  const value = {
    subscriptionStatus: subscriptionStatus || null,
    isLoading,
    error: error as Error | null,
    canCreateRestaurant,
    restaurantsRemaining,
  };

  return (
    <SubscriptionStatusContext.Provider value={value}>
      {children}
    </SubscriptionStatusContext.Provider>
  );
}

export function useSubscriptionStatus(): UseSubscriptionStatusResult {
  const context = useContext(SubscriptionStatusContext);
  if (!context) {
    throw new Error("useSubscriptionStatus must be used within a SubscriptionStatusProvider");
  }
  return context;
}