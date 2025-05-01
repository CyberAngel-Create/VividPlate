import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Users, Settings, LayoutDashboard, LogOut, 
  Menu, X, ChevronDown, Building, FileText 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      // Use the correct API endpoint for logout
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/admin-login");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      href: "/admin",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      title: "Users",
      href: "/admin/users",
      icon: <Users className="h-5 w-5" />,
    },
    {
      title: "Restaurants",
      href: "/admin/restaurants",
      icon: <Building className="h-5 w-5" />,
    },
    {
      title: "Logs",
      href: "/admin/logs",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4">
            <Link href="/admin">
              <div className="flex items-center">
                <img src="/logo.svg" alt="DigitaMenuMate" className="h-8 w-8" />
                <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">Admin</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1 mt-5">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                    isActive
                      ? "bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  }`}
                >
                  <div className="mr-3">{item.icon}</div>
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden p-2 rounded-md fixed top-4 left-4 z-10"
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="flex flex-col h-full">
            <div className="px-4 py-6 border-b">
              <div className="flex items-center justify-between">
                <Link href="/admin" onClick={() => setIsOpen(false)}>
                  <div className="flex items-center">
                    <img src="/logo.svg" alt="DigitaMenuMate" className="h-8 w-8" />
                    <span className="ml-2 text-xl font-semibold">Admin</span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-6 w-6" />
                  <span className="sr-only">Close sidebar</span>
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <nav className="px-2 pt-4 pb-10">
                {navItems.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                        isActive
                          ? "bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-300"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                      }`}
                    >
                      <div className="mr-3">{item.icon}</div>
                      {item.title}
                    </Link>
                  );
                })}
              </nav>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 h-16 flex items-center justify-between">
            <div className="ml-10 md:ml-0"></div>
            <div className="flex items-center">
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center">
                      <span className="mr-2">{user.username}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;