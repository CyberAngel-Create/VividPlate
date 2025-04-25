import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Restaurant } from "@shared/schema";

export function useRestaurant() {
  const [activeRestaurant, setActiveRestaurant] = useState<Restaurant | null>(null);
  
  // Fetch all restaurants for the current user
  const {
    data: restaurants = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
    onSuccess: (data) => {
      // If there are restaurants and no active restaurant is set, set the first one
      if (data.length > 0 && !activeRestaurant) {
        setActiveRestaurant(data[0]);
      }
    },
    onError: () => {
      setActiveRestaurant(null);
    },
  });
  
  // Function to change the active restaurant
  const setActiveRestaurantById = (id: number) => {
    const restaurant = restaurants.find(r => r.id === id);
    if (restaurant) {
      setActiveRestaurant(restaurant);
    }
  };
  
  // Function to refetch the active restaurant with fresh data
  const refetchActiveRestaurant = async () => {
    await refetch();
    
    if (activeRestaurant) {
      try {
        const refreshedRestaurant = await queryClient.fetchQuery({
          queryKey: [`/api/restaurants/${activeRestaurant.id}`],
        }) as Restaurant;
        
        setActiveRestaurant(refreshedRestaurant);
      } catch (error) {
        console.error("Failed to refresh active restaurant", error);
      }
    }
  };
  
  return {
    restaurants,
    activeRestaurant,
    setActiveRestaurant: setActiveRestaurantById,
    isLoading,
    isError,
    refetchActiveRestaurant,
  };
}
