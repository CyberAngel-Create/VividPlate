import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Restaurant, InsertRestaurant } from "@shared/schema";
import { useRestaurant } from "@/hooks/use-restaurant";
import { useSubscriptionStatus } from "@/hooks/use-subscription-status";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RestaurantProfileForm from "@/components/restaurant/RestaurantProfileForm";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RocketIcon } from "lucide-react";

interface CreateRestaurantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateRestaurantModal = ({ isOpen, onClose }: CreateRestaurantModalProps) => {
  const { toast } = useToast();
  const { refetchActiveRestaurant } = useRestaurant();
  const {
    subscriptionStatus,
    isLoading: isLoadingSubscription,
    canCreateRestaurant,
    restaurantsRemaining
  } = useSubscriptionStatus();

  // Mutation to create restaurant
  const createRestaurantMutation = useMutation({
    mutationFn: async (restaurant: InsertRestaurant) => {
      const response = await apiRequest("POST", "/api/restaurants", restaurant);
      
      // Check if the response is not ok (e.g., we hit the restaurant limit)
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create restaurant");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      
      // After successful creation, show toast
      toast({
        title: "Success",
        description: "Restaurant created successfully",
      });
      
      // Set a flag in session storage to indicate form should be reset
      sessionStorage.setItem("resetRestaurantForm", "true");
      
      // Refetch the restaurant list
      queryClient.refetchQueries({ queryKey: ["/api/restaurants"] });
      
      // Close the modal
      onClose();
    },
    onError: (error) => {
      console.error("Restaurant creation error:", error);
      
      // Check if it's a limit error
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to create restaurant. Please try again.";
      
      const isLimitError = errorMessage.includes("limit");
      
      toast({
        title: isLimitError ? "Restaurant Limit Reached" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const handleSubmit = async (restaurantData: Partial<Restaurant>) => {
    // Check if user can create a new restaurant
    if (!canCreateRestaurant) {
      toast({
        title: "Restaurant Limit Reached",
        description: "Each account can only manage one restaurant. Create a new owner account or contact support to add another.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new restaurant
    await createRestaurantMutation.mutateAsync(restaurantData as InsertRestaurant);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading font-bold">Create New Restaurant</DialogTitle>
          <DialogDescription>
            Fill out the form below to create a new restaurant.
          </DialogDescription>
        </DialogHeader>

        {!isLoadingSubscription && subscriptionStatus && (
          <Alert className="mb-6 dark:bg-gray-700 dark:border-primary dark:text-white">
            <RocketIcon className="h-4 w-4" />
            <AlertTitle>Subscription Status: {subscriptionStatus.tier}</AlertTitle>
            <AlertDescription>
              You are using {subscriptionStatus.currentRestaurants} of {subscriptionStatus.maxRestaurants} restaurant.
              {!canCreateRestaurant && (
                <div className="mt-2 text-destructive dark:text-red-400">
                  Each account can only manage one restaurant. Create a new owner account or contact support to operate additional locations.
                </div>
              )}
              {canCreateRestaurant && (
                <div className="mt-2 text-green-600 dark:text-green-400">
                  You can create {restaurantsRemaining} more restaurant{restaurantsRemaining !== 1 ? 's' : ''}.
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4">
          <RestaurantProfileForm 
            restaurant={undefined}
            onSubmit={handleSubmit}
            canCreateRestaurant={canCreateRestaurant}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRestaurantModal;