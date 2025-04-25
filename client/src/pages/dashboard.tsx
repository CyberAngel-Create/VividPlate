import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import StatCard from "@/components/dashboard/StatCard";
import RestaurantInfoCard from "@/components/dashboard/RestaurantInfoCard";
import QuickActions from "@/components/dashboard/QuickActions";
import RecentUpdates from "@/components/dashboard/RecentUpdates";
import TabNavigation from "@/components/layout/TabNavigation";
import { Eye, QrCode, Utensils, Calendar } from "lucide-react";
import { Restaurant } from "@shared/schema";
import { useRestaurant } from "@/hooks/use-restaurant";

interface Stats {
  viewCount: number;
  qrScanCount: number;
  menuItemCount: number;
  daysActive: number;
}

interface Update {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
}

const Dashboard = () => {
  const { toast } = useToast();
  const { activeRestaurant, restaurants, isLoading: isLoadingRestaurants, refetchActiveRestaurant } = useRestaurant();
  
  // Stats query
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: [activeRestaurant ? `/api/restaurants/${activeRestaurant.id}/stats` : null],
    enabled: !!activeRestaurant,
  });
  
  // Generate some recent updates based on activities
  const [updates, setUpdates] = useState<Update[]>([]);
  
  useEffect(() => {
    if (activeRestaurant) {
      // This would ideally come from an API, but for now we'll generate some dummy updates
      setUpdates([
        {
          id: "1",
          title: "Added New Item: Truffle Pasta",
          description: "Added to Main Courses category",
          timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
        },
        {
          id: "2",
          title: "Updated Restaurant Hours",
          description: "Changed Friday closing time to 11:00 PM",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) // 1 day ago
        },
        {
          id: "3",
          title: "Menu Link Shared",
          description: "Shared menu link via email to 5 recipients",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
        }
      ]);
    }
  }, [activeRestaurant]);

  // If we have restaurants but no active restaurant, refetch to ensure we have the latest data
  useEffect(() => {
    if (restaurants.length > 0 && !activeRestaurant) {
      refetchActiveRestaurant();
    }
  }, [restaurants, activeRestaurant, refetchActiveRestaurant]);

  if (isLoadingRestaurants) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!activeRestaurant) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-lg mb-4">You haven't created a restaurant yet.</p>
            <p className="mb-6">Create your first restaurant to get started with MenuMate.</p>
            <button 
              onClick={() => window.location.href = "/edit-restaurant"}
              className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-opacity-90 transition-colors"
            >
              Create Restaurant
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <TabNavigation />
      
      <section className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-heading font-bold mb-6">Restaurant Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={<Eye className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : stats?.viewCount || 0} 
            label="Menu Views" 
          />
          <StatCard 
            icon={<QrCode className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : stats?.qrScanCount || 0} 
            label="QR Scans" 
          />
          <StatCard 
            icon={<Utensils className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : stats?.menuItemCount || 0} 
            label="Menu Items" 
          />
          <StatCard 
            icon={<Calendar className="h-6 w-6" />} 
            value={isLoadingStats ? "..." : stats?.daysActive || 0} 
            label="Days Active" 
          />
        </div>
        
        <RestaurantInfoCard restaurant={activeRestaurant} />
        
        <QuickActions />
        
        <RecentUpdates updates={updates} />
      </section>
    </div>
  );
};

export default Dashboard;
