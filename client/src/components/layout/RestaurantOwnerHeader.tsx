import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, User, LogOut, Home, Utensils, Bell, Settings, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface RestaurantOwnerHeaderProps {
  onLogout: () => Promise<void>;
}

const RestaurantOwnerHeader: React.FC<RestaurantOwnerHeaderProps> = ({ onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [location] = useLocation();

  // Function to get user's initials for avatar fallback
  const getUserInitials = () => {
    if (!user) return "U";
    if (user.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user.username.substring(0, 2).toUpperCase();
  };

  // Check if a path is the current location
  const isActivePath = (path: string) => {
    return location === path;
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and branding */}
          <div className="flex items-center">
            <Link href="/dashboard">
              <div className="flex items-center space-x-2">
                <Utensils className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">MenuMate</span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard">
              <a
                className={`text-sm font-medium transition-colors ${
                  isActivePath("/dashboard")
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Dashboard
              </a>
            </Link>
            <Link href="/restaurants">
              <a
                className={`text-sm font-medium transition-colors ${
                  isActivePath("/restaurants")
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                My Restaurants
              </a>
            </Link>
            <Link href="/create-menu">
              <a
                className={`text-sm font-medium transition-colors ${
                  isActivePath("/create-menu")
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Create Menu
              </a>
            </Link>
            <Link href="/share-menu">
              <a
                className={`text-sm font-medium transition-colors ${
                  isActivePath("/share-menu")
                    ? "text-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Share Menu
              </a>
            </Link>
          </nav>

          {/* User profile and settings */}
          <div className="flex items-center space-x-4">
            {/* Notifications - Desktop */}
            <div className="hidden md:block">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
            </div>

            {/* User profile dropdown - Desktop */}
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 p-1">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={user?.username || "User"} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center">
                      <span className="text-sm font-medium mr-1">{user?.username}</span>
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <div className="flex items-center cursor-pointer" onClick={() => window.location.href = "/profile"}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <div className="flex items-center cursor-pointer" onClick={() => window.location.href = "/subscription"}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Subscription</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onLogout} className="text-red-500 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="flex flex-col h-full">
                  <div className="flex flex-col space-y-4 pt-6">
                    {/* User info */}
                    <div className="flex items-center space-x-3 border-b border-gray-200 pb-6">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" alt={user?.username || "User"} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user?.username}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                    </div>

                    {/* Navigation links */}
                    <Link href="/dashboard">
                      <a className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100">
                        <Home className="mr-3 h-5 w-5 text-gray-500" />
                        <span>Dashboard</span>
                      </a>
                    </Link>
                    <Link href="/restaurants">
                      <a className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100">
                        <Utensils className="mr-3 h-5 w-5 text-gray-500" />
                        <span>My Restaurants</span>
                      </a>
                    </Link>
                    <Link href="/create-menu">
                      <a className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100">
                        <Utensils className="mr-3 h-5 w-5 text-gray-500" />
                        <span>Create Menu</span>
                      </a>
                    </Link>
                    <Link href="/share-menu">
                      <a className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100">
                        <Utensils className="mr-3 h-5 w-5 text-gray-500" />
                        <span>Share Menu</span>
                      </a>
                    </Link>
                    <Link href="/profile">
                      <a className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100">
                        <User className="mr-3 h-5 w-5 text-gray-500" />
                        <span>Profile</span>
                      </a>
                    </Link>
                    <Link href="/subscription">
                      <a className="flex items-center py-2 px-3 rounded-md hover:bg-gray-100">
                        <Settings className="mr-3 h-5 w-5 text-gray-500" />
                        <span>Subscription</span>
                      </a>
                    </Link>

                    {/* Logout button */}
                    <button
                      onClick={onLogout}
                      className="flex items-center py-2 px-3 rounded-md text-red-500 hover:bg-red-50 mt-auto"
                    >
                      <LogOut className="mr-3 h-5 w-5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RestaurantOwnerHeader;