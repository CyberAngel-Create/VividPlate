import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, MenuSquare, User, Eye, Share2, CreditCard, Mail, LogOut, Menu, Store, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslation } from "react-i18next";
import { useSubscription } from "@/hooks/use-subscription";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

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

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location]);
  
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
      id: 'tutorial', 
      icon: <HelpCircle className="h-5 w-5" />, 
      label: 'Tutorial', 
      path: '/tutorial' 
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
      {/* Mobile Menu Button - Simple and Always Visible */}
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-lg text-gray-700 bg-white shadow-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={() => setIsMobileSidebarOpen(true)}
        aria-label="Open navigation menu"
        style={{ 
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 9999,
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }}
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Sidebar Overlay - Simple Implementation */}
      {isMobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setIsMobileSidebarOpen(false)} 
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-white bg-opacity-20"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Close navigation menu"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            
            {/* Mobile Sidebar Content */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <h1 className="text-xl font-bold text-primary">VividPlate</h1>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navItems.map((item) => {
                        // Show/hide items based on subscription status
                        if (item.showFor === "free" && isPaid) return null;
                        if (item.showFor === "premium" && !isPaid) return null;
                        
                        return (
                          <li key={item.id}>
                            <Link href={item.path}>
                              <div
                                className={cn(
                                  location === item.path
                                    ? 'bg-gray-50 text-primary'
                                    : 'text-gray-700 hover:text-primary hover:bg-gray-50',
                                  'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium cursor-pointer'
                                )}
                                onClick={() => setIsMobileSidebarOpen(false)}
                              >
                                <span className={cn(
                                  location === item.path ? 'text-primary' : 'text-gray-400 group-hover:text-primary',
                                  'flex-shrink-0'
                                )}>
                                  {item.icon}
                                </span>
                                {item.label}
                              </div>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                  <li className="mt-auto">
                    <button
                      onClick={() => {
                        setIsMobileSidebarOpen(false);
                        onLogout();
                      }}
                      className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-700 hover:bg-gray-50 hover:text-primary w-full"
                    >
                      <LogOut className="h-5 w-5 text-gray-400 group-hover:text-primary" />
                      Logout
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}

    
      {/* Desktop Sidebar - Fixed at the left side */}
      <aside className="hidden lg:flex flex-col w-52 h-screen fixed left-0 top-0 bottom-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40">
        {/* Logo */}
        <div className="p-4 border-b dark:border-gray-800">
          <Link href="/dashboard">
            <span className="text-xl font-heading font-bold text-primary dark:text-primary-light">VividPlate</span>
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