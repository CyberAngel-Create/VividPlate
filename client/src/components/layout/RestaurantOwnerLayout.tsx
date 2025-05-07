import { ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import SidebarNavigation from "./SidebarNavigation";
import RestaurantOwnerHeader from "./RestaurantOwnerHeader";

interface RestaurantOwnerLayoutProps {
  children: ReactNode;
}

const RestaurantOwnerLayout = ({ children }: RestaurantOwnerLayoutProps) => {
  const { toast } = useToast();

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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <SidebarNavigation onLogout={handleLogout} />
      
      {/* Main content area */}
      <main className="flex-1 lg:ml-64 min-h-screen">
        {/* Restaurant Switcher Header */}
        <div>
          <RestaurantOwnerHeader />
        </div>
        
        {/* Page Content */}
        <div className="p-0 px-0">
          {children}
        </div>
      </main>
    </div>
  );
};

export default RestaurantOwnerLayout;