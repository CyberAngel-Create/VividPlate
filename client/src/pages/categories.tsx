import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import CategoryManagement from "@/components/menu/CategoryManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Restaurant as RestaurantType } from "@shared/schema";

const CategoriesPage = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);

  // Fetch restaurants
  const { data: restaurants = [], isLoading: restaurantsLoading } = useQuery<RestaurantType[]>({
    queryKey: ["/api/restaurants"],
    enabled: !!user,
  });

  // Set default restaurant when restaurants load
  useEffect(() => {
    if (restaurants.length > 0 && !selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || restaurantsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (restaurants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">{t("No Restaurants Found")}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {t("You need to create a restaurant first before managing categories.")}
            </p>
            <Button onClick={() => setLocation("/edit-restaurant")}>
              <Store className="h-4 w-4 mr-2" />
              {t("Create Restaurant")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold dark:text-white">
                {t("Manage Categories")}
              </h1>
              <p className="text-muted-foreground">
                {t("Organize your menu categories and reorder them")}
              </p>
            </div>
          </div>
        </div>

        {/* Restaurant Selector */}
        {restaurants.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("Select Restaurant")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {restaurants.map((restaurant) => (
                  <Button
                    key={restaurant.id}
                    variant={selectedRestaurantId === restaurant.id ? "default" : "outline"}
                    className="h-auto p-4 justify-start"
                    onClick={() => setSelectedRestaurantId(restaurant.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-sm text-muted-foreground truncate">
                        {restaurant.description || t("No description")}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Management */}
        {selectedRestaurantId && (
          <div className="space-y-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Store className="h-4 w-4" />
              <span>{selectedRestaurant?.name}</span>
            </div>
            <CategoryManagement restaurantId={selectedRestaurantId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesPage;