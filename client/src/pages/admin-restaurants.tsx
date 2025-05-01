import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Restaurant } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

const AdminRestaurants = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Fetch all restaurants
  const { data: restaurants = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/restaurants"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/restaurants");
      const data = await response.json();
      return data;
    }
  });

  const filteredRestaurants = restaurants.filter((restaurant: Restaurant) => 
    restaurant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Restaurants Management</h1>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search restaurants..."
                className="pl-8 w-[250px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button onClick={() => refetch()}>Refresh</Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Total Restaurants</div>
                <div className="text-3xl font-bold">{restaurants.length}</div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Premium Restaurants</div>
                <div className="text-3xl font-bold">
                  {restaurants.filter((r: any) => r.isPremium).length}
                </div>
              </div>
              
              <div className="bg-white shadow rounded-lg p-4">
                <div className="text-sm font-medium text-gray-500">Free Restaurants</div>
                <div className="text-3xl font-bold">
                  {restaurants.filter((r: any) => !r.isPremium).length}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Menu Items</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRestaurants.length > 0 ? (
                    filteredRestaurants.map((restaurant: any) => (
                      <TableRow key={restaurant.id} className="hover:bg-gray-50">
                        <TableCell>{restaurant.id}</TableCell>
                        <TableCell className="font-medium">
                          {restaurant.name}
                          {restaurant.isPremium && (
                            <Badge className="ml-2 bg-orange-500">Premium</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{restaurant.ownerName || "N/A"}</span>
                            {restaurant.userEmail && (
                              <span className="text-xs text-gray-500">{restaurant.userEmail}</span>
                            )}
                            {restaurant.subscriptionTier === 'premium' && (
                              <Badge className="mt-1 w-fit bg-orange-500">Premium User</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{restaurant.categoryCount || 0}</span>
                            {restaurant.categoryCount > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {restaurant.categoryCount === 1 ? "1 category" : `${restaurant.categoryCount} categories`}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{restaurant.menuItemCount || 0}</span>
                            {restaurant.menuItemCount > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {restaurant.menuItemCount === 1 ? "1 item" : `${restaurant.menuItemCount} items`}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="font-medium">{restaurant.viewCount || 0}</span>
                            {restaurant.viewCount > 0 && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {restaurant.viewCount === 1 ? "1 view" : `${restaurant.viewCount} views`}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={restaurant.isActive ? "bg-green-500" : "bg-red-500"}>
                            {restaurant.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(`/view-menu/${restaurant.id}`, '_blank');
                              }}
                            >
                              View Menu
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                // Implement details view
                              }}
                            >
                              Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6">
                        {searchTerm ? "No restaurants match your search" : "No restaurants found"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminRestaurants;