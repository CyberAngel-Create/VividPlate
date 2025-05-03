import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useSubscription } from "@/hooks/use-subscription";
import { LayoutDashboard, Settings, Share2, Menu as MenuIcon, CreditCard } from "lucide-react";
import { useRestaurant } from "@/hooks/use-restaurant";
import { cn } from "@/lib/utils";

const TabNavigation = () => {
  const [location] = useLocation();
  const { isPaid } = useSubscription();
  const { activeRestaurant } = useRestaurant();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Define tabs
  const tabs = [
    {
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      href: "/dashboard",
      isActive: location === "/dashboard",
    },
    {
      icon: <MenuIcon className="h-5 w-5" />,
      label: "Create Menu",
      href: "/create-menu",
      isActive: location === "/create-menu",
    },
    {
      icon: <Share2 className="h-5 w-5" />,
      label: "Share Menu",
      href: "/share-menu",
      isActive: location === "/share-menu",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Profile",
      href: "/profile",
      isActive: location === "/profile",
    }
  ];

  // Only add the "Pricing" tab for free users
  if (hasMounted && !isPaid) {
    tabs.push({
      icon: <CreditCard className="h-5 w-5" />,
      label: "Pricing",
      href: "/pricing",
      isActive: location === "/pricing",
    });
  }

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-30">
      <div className="container mx-auto">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab, index) => (
            <Link key={index} href={tab.href}>
              <a
                className={cn(
                  "flex items-center justify-center space-x-2 px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors",
                  tab.isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-primary hover:border-gray-300"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TabNavigation;