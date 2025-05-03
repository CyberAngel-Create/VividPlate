import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TabNavigation from "@/components/layout/TabNavigation";
import RestaurantOwnerHeader from "@/components/layout/RestaurantOwnerHeader";
import RestaurantOwnerFooter from "@/components/layout/RestaurantOwnerFooter";
import { Restaurant } from "@shared/schema";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit, ExternalLink, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { normalizeImageUrl } from "@/lib/imageUtils";

const RestaurantsPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isPaid, subscription } = useSubscription();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch all user's restaurants
  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["/api/restaurants"],
  });

  // Set active restaurant
  const setActiveRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: number) => {
      return await apiRequest("POST", "/api/user/set-active-restaurant", { restaurantId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to set active restaurant",
        variant: "destructive",
      });
    },
  });

  // Delete restaurant mutation
  const deleteRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: number) => {
      return await apiRequest("DELETE", `/api/restaurants/${restaurantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/restaurants"] });
      toast({
        title: "Restaurant deleted",
        description: "The restaurant has been successfully deleted",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete restaurant",
        variant: "destructive",
      });
    },
  });

  const handleDeleteRestaurant = (restaurantId: number) => {
    setDeleteId(null);
    deleteRestaurantMutation.mutate(restaurantId);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleSetActive = (restaurantId: number) => {
    setActiveRestaurantMutation.mutate(restaurantId);
  };

  // Check if the user is on a premium plan
  if (!isPaid) {
    return (
      <div className="flex flex-col min-h-screen">
        <RestaurantOwnerHeader onLogout={handleLogout} />
        <TabNavigation />
        
        <div className="container mx-auto px-4 py-12 flex-grow">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-6">Premium Feature</h1>
            <p className="text-lg mb-8">
              Managing multiple restaurants is a premium feature. Upgrade your plan to create and manage multiple restaurants.
            </p>
            <Button 
              className="bg-primary text-white px-6 py-2 rounded-md"
              onClick={() => setLocation("/pricing")}
            >
              View Pricing Plans
            </Button>
          </div>
        </div>

        <RestaurantOwnerFooter />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <RestaurantOwnerHeader onLogout={handleLogout} />
        <TabNavigation />
        
        <div className="container mx-auto px-4 py-8 flex-grow">
          <h1 className="text-2xl font-heading font-bold mb-6">My Restaurants</h1>
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>

        <RestaurantOwnerFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <RestaurantOwnerHeader onLogout={handleLogout} />
      <TabNavigation />
      
      <div className="container mx-auto px-4 py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-heading font-bold">My Restaurants</h1>
          
          {restaurants && subscription && subscription.maxRestaurants && restaurants.length < subscription.maxRestaurants && (
            <Button 
              onClick={() => setLocation("/edit-restaurant")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Restaurant
            </Button>
          )}
        </div>

        {restaurants && restaurants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-lg mb-4">You haven't created any restaurants yet.</p>
            <p className="mb-6">Create your first restaurant to get started with MenuMate.</p>
            <Button 
              onClick={() => setLocation("/edit-restaurant")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Create Restaurant
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants?.map((restaurant) => (
              <Card key={restaurant.id} className="overflow-hidden border border-gray-200 rounded-lg">
                <div className="h-40 bg-gray-200 relative">
                  {restaurant.bannerUrl ? (
                    <img 
                      src={normalizeImageUrl(restaurant.bannerUrl)}
                      alt={`${restaurant.name} banner`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      No Banner
                    </div>
                  )}
                  
                  <div className="absolute top-3 right-3 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-100 h-8 w-8 p-0 rounded-full"
                      onClick={() => setLocation(`/menu/${restaurant.id}`)}
                      title="View Menu"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white hover:bg-gray-100 h-8 w-8 p-0 rounded-full"
                      onClick={() => setLocation(`/edit-restaurant?id=${restaurant.id}`)}
                      title="Edit Restaurant"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <AlertDialog open={deleteId === restaurant.id} onOpenChange={(open) => !open && setDeleteId(null)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white hover:bg-gray-100 text-red-500 hover:text-red-600 h-8 w-8 p-0 rounded-full"
                          onClick={() => setDeleteId(restaurant.id)}
                          title="Delete Restaurant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Restaurant</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{restaurant.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => handleDeleteRestaurant(restaurant.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                      {restaurant.logoUrl ? (
                        <img 
                          src={normalizeImageUrl(restaurant.logoUrl)} 
                          alt={`${restaurant.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Logo
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1 truncate">{restaurant.name}</h3>
                      <p className="text-sm text-gray-500 mb-2 truncate">{restaurant.cuisine || "No cuisine set"}</p>
                      
                      <Button
                        size="sm"
                        variant={restaurant.isActive ? "default" : "outline"}
                        className={restaurant.isActive ? "bg-primary/90 hover:bg-primary" : ""}
                        onClick={() => !restaurant.isActive && handleSetActive(restaurant.id)}
                        disabled={restaurant.isActive || setActiveRestaurantMutation.isPending}
                      >
                        {restaurant.isActive ? "Active Restaurant" : "Set as Active"}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {restaurants && subscription && subscription.maxRestaurants !== null && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Using {restaurants.length} of {subscription.maxRestaurants} available restaurant slots in your subscription.
          </div>
        )}
      </div>

      <RestaurantOwnerFooter />
    </div>
  );
};

export default RestaurantsPage;