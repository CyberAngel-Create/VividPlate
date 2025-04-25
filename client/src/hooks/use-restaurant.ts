import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Restaurant } from "@shared/schema";

export function useRestaurant() {
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  
  // Fetch all restaurants for the current user
  const {
    data: restaurants = [] as Restaurant[],
    isLoading,
    isError,
    refetch,
  } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });
  
  // Set the active restaurant when the restaurant list changes
  useEffect(() => {
    // If there are restaurants and no active restaurant is set, set the first one
    if (restaurants.length > 0 && (!activeRestaurant || !restaurants.some(r => r.id === activeRestaurant.id))) {
      setActiveRestaurant(restaurants[0]);
    }
  }, [restaurants, activeRestaurant]);
  
  // Function to change the active restaurant
  const setActiveRestaurantById = useCallback((id: number) => {
    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant) {
      setActiveRestaurant(restaurant);
    }
  }, [restaurants]);
  
  // Function to refetch the active restaurant with fresh data
  const refetchActiveRestaurant = useCallback(async () => {
    try {
      // Refetch restaurants list
      const { data: updatedRestaurants } = await refetch();
      
      if (updatedRestaurants && updatedRestaurants.length > 0) {
        // If we have an active restaurant, try to find it in the updated list
        if (activeRestaurant) {
          const matchingRestaurant = updatedRestaurants.find(r => r.id === activeRestaurant.id);
          if (matchingRestaurant) {
            try {
              // Try to fetch the detailed data for the active restaurant
              const refreshedRestaurant = await queryClient.fetchQuery<Restaurant>({
                queryKey: [`/api/restaurants/${activeRestaurant.id}`],
              });
              
              setActiveRestaurant(refreshedRestaurant);
            } catch (error) {
              console.error("Failed to refresh active restaurant detail", error);
              // If we can't fetch the detailed data, use the one from the list
              setActiveRestaurant(matchingRestaurant);
            }
          } else {
            // If the active restaurant is no longer in the list, set the first one
            setActiveRestaurant(updatedRestaurants[0]);
          }
        } else {
          // If no active restaurant, set the first one
          setActiveRestaurant(updatedRestaurants[0]);
        }
      } else {
        // If no restaurants, clear active restaurant
        setActiveRestaurant(null);
      }
    } catch (error) {
      console.error("Failed to refresh restaurants", error);
    }
  }, [refetch, activeRestaurant]);
  
  return {
    restaurants,
    activeRestaurant,
    setActiveRestaurant: setActiveRestaurantById,
    isLoading,
    isError,
    refetchActiveRestaurant,
  };
}
