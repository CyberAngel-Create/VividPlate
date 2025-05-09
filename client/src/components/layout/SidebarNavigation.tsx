import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, MenuSquare, User, Eye, Share2, CreditCard, Mail, LogOut, Menu, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/use-subscription";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface SidebarNavigationProps {
  onLogout?: () => void;
}

type NavItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  showFor?: "all" | "free" | "premium";
};

const SidebarNavigation = ({ onLogout = () => {} }: SidebarNavigationProps) => {
  const [location, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { subscription, isPaid } = useSubscription();
  const { t } = useTranslation();
  
  // Define navigation items
  const navItems: NavItem[] = [
    { 
      id: 'dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      label: 'Dashboard', 
      path: '/dashboard' 
    },
    { 
      id: 'create-menu', 
      icon: <MenuSquare className="h-5 w-5" />, 
      label: 'Create Menu', 
      path: '/create-menu' 
    },
    { 
      id: 'edit-restaurant', 
      icon: <Store className="h-5 w-5" />, 
      label: 'Restaurant Profile', 
      path: '/edit-restaurant' 
    },
    { 
      id: 'menu-preview', 
      icon: <Eye className="h-5 w-5" />, 
      label: 'Menu Preview', 
      path: '/menu-preview' 
    },
    { 
      id: 'share', 
      icon: <Share2 className="h-5 w-5" />, 
      label: 'Share Menu', 
      path: '/share-menu' 
    },
    { 
      id: 'pricing', 
      icon: <CreditCard className="h-5 w-5" />, 
      label: 'Upgrade Plan', 
      path: '/pricing',
      showFor: "free" 
    },
    {
      id: 'profile',
      icon: <User className="h-5 w-5" />,
      label: 'Profile',
      path: '/profile'
    },
    {
      id: 'contact',
      icon: <Mail className="h-5 w-5" />,
      label: 'Contact',
      path: '/contact'
    }
  ];

  // Filter items based on subscription status
  const filteredNavItems = navItems.filter(item => {
    if (!item.showFor || item.showFor === "all") return true;
    if (item.showFor === "premium" && isPaid) return true;
    if (item.showFor === "free" && !isPaid) return true;
    return false;
  });

  const isActive = (path: string) => {
    return location === path;
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      {/* Mobile Header with Logo and Menu Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16">
        <Link href="/dashboard">
          <div>
            <span className="text-xl font-heading font-bold text-primary dark:text-primary-light">MenuMate</span>
            <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">Owner</span>
          </div>
        </Link>
        
        <div className="flex items-center gap-2">
          <ThemeToggle variant="ghost" size="icon" tooltipPosition="bottom" />
          <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b dark:border-gray-800">
                  <span className="text-lg font-heading font-bold text-primary dark:text-primary-light">MenuMate</span>
                </div>
                
                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-2">
                    {filteredNavItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavigation(item.path)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                            isActive(item.path)
                              ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light font-medium'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary-light dark:hover:bg-gray-800'
                          }`}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                {/* Logout */}
                <div className="p-4 border-t dark:border-gray-800">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-start gap-3"
                    onClick={onLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    
      {/* Desktop Sidebar - Fixed at the left side */}
      <aside className="hidden lg:flex flex-col w-52 h-screen fixed left-0 top-0 bottom-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40">
        {/* Logo */}
        <div className="p-4 border-b dark:border-gray-800">
          <Link href="/dashboard">
            <span className="text-xl font-heading font-bold text-primary dark:text-primary-light">MenuMate</span>
            <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">Owner</span>
          </Link>
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                    isActive(item.path)
                      ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light font-medium'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary-light dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* Theme Toggle and Logout */}
        <div className="p-4 border-t dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Appearance</span>
            <ThemeToggle variant="outline" size="sm" tooltipPosition="top" />
          </div>
          <Button
            variant="outline"
            className="w-full flex items-center justify-start gap-3"
            onClick={onLogout}
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </aside>
      
      {/* Mobile padding for content - handled in RestaurantOwnerLayout */}
    </>
  );
};

export default SidebarNavigation;