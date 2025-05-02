import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Users, Settings, LayoutDashboard, LogOut, 
  Menu, X, Building, FileText,
  UserCircle, User, Crown, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription 
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/login");
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
      title: "Pricing",
      href: "/admin/pricing",
      icon: <Crown className="h-5 w-5" />,
    },
    {
      title: "Logs",
      href: "/admin/logs",
      icon: <FileText className="h-5 w-5" />,
    },
    {
      title: "Profile",
      href: "#profile",
      icon: <UserCircle className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/admin/settings",
      icon: <Settings className="h-5 w-5" />,
    },
    {
      title: "Contact Info",
      href: "/admin/contact-info",
      icon: <Mail className="h-5 w-5" />,
    },
    {
      title: "Logout",
      href: "#logout",
      icon: <LogOut className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Sidebar for desktop */}
      <div className="hidden md:flex md:w-52 md:flex-col md:fixed h-full">
        <div className="flex flex-col flex-grow pt-3 overflow-y-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4">
            <Link href="/admin">
              <div className="flex items-center">
                <img src="/logo.svg" alt="DigitaMenuMate" className="h-8 w-8" />
                <span className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">Admin</span>
              </div>
            </Link>
          </div>
          <nav className="flex-1 px-2 pb-4 space-y-1 mt-3">
            {navItems.map((item) => {
              const isActive = location === item.href;
              
              if (item.href === "#profile") {
                return (
                  <button
                    key={item.title}
                    onClick={() => setIsProfileOpen(true)}
                    className="flex items-center px-2 py-1.5 text-xs font-medium rounded-md group w-full text-left
                      text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  >
                    <div className="mr-2">{item.icon}</div>
                    {item.title}
                  </button>
                );
              }
              
              if (item.href === "#logout") {
                return (
                  <button
                    key={item.title}
                    onClick={handleLogout}
                    className="flex items-center px-2 py-1.5 text-xs font-medium rounded-md group w-full text-left
                      text-red-500 hover:bg-gray-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-gray-700 dark:hover:text-red-300"
                  >
                    <div className="mr-2">{item.icon}</div>
                    {item.title}
                  </button>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-2 py-1.5 text-xs font-medium rounded-md group ${
                    isActive
                      ? "bg-gray-100 text-blue-600 dark:bg-gray-700 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                  }`}
                >
                  <div className="mr-2">{item.icon}</div>
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
                  
                  if (item.href === "#profile") {
                    return (
                      <button
                        key={item.title}
                        onClick={() => {
                          setIsProfileOpen(true);
                          setIsOpen(false);
                        }}
                        className="flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 w-full text-left
                          text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                      >
                        <div className="mr-3">{item.icon}</div>
                        {item.title}
                      </button>
                    );
                  }
                  
                  if (item.href === "#logout") {
                    return (
                      <button
                        key={item.title}
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                        className="flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 w-full text-left
                          text-red-500 hover:bg-gray-50 hover:text-red-600 dark:text-red-400 dark:hover:bg-gray-700 dark:hover:text-red-300"
                      >
                        <div className="mr-3">{item.icon}</div>
                        {item.title}
                      </button>
                    );
                  }
                  
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
      <div className="flex flex-col flex-1 overflow-hidden md:ml-52">
        {/* Topbar */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="px-4 h-10 flex items-center justify-end">
            {/* Header is kept empty as logout is now in the sidebar */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
          {children}
        </main>
      </div>

      {/* Profile Drawer */}
      {user && (
        <Sheet open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <SheetContent className="w-[400px] sm:w-[540px] p-6 overflow-y-auto">
            <SheetHeader className="mb-5">
              <SheetTitle>Admin Profile</SheetTitle>
              <SheetDescription>
                Manage your admin account details
              </SheetDescription>
            </SheetHeader>
            <form 
              className="space-y-4 py-4"
              onSubmit={async (e) => {
                e.preventDefault();
                
                // Get form values
                const formData = new FormData(e.currentTarget);
                const username = formData.get('username') as string;
                const email = formData.get('email') as string;
                const currentPassword = formData.get('current-password') as string;
                const newPassword = formData.get('new-password') as string;
                
                // Basic validation
                if (!username || !email) {
                  toast({
                    title: "Missing information",
                    description: "Username and email are required",
                    variant: "destructive"
                  });
                  return;
                }
                
                // Different payloads based on whether password is being changed
                const updateData: any = { username, email };
                
                if (newPassword && currentPassword) {
                  updateData.currentPassword = currentPassword;
                  updateData.newPassword = newPassword;
                } else if (newPassword && !currentPassword) {
                  toast({
                    title: "Missing current password",
                    description: "Please enter your current password to change to a new one",
                    variant: "destructive"
                  });
                  return;
                }
                
                try {
                  // Admin profile update endpoint
                  const response = await fetch('/api/admin/profile', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updateData)
                  });
                  
                  if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to update profile');
                  }
                  
                  // Show success message
                  toast({
                    title: "Profile updated",
                    description: "Your profile has been updated successfully",
                  });
                  setIsProfileOpen(false);
                  
                  // Force refresh the user data
                  queryClient.invalidateQueries({ queryKey: ['/api/user'] });
                } catch (error) {
                  console.error('Profile update error:', error);
                  toast({
                    title: "Update failed",
                    description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
            >
              {/* Admin profile info */}
              
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label htmlFor="username" className="text-sm font-medium">Username</label>
                  <Input 
                    id="username"
                    name="username"
                    defaultValue={user.username}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email}
                    required
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="current-password" className="text-sm font-medium">Current Password</label>
                  <Input 
                    id="current-password"
                    name="current-password"
                    type="password"
                    placeholder="Enter current password to confirm changes"
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="new-password" className="text-sm font-medium">New Password (optional)</label>
                  <Input 
                    id="new-password"
                    name="new-password"
                    type="password"
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                
                <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Role</p>
                  <p className="text-sm">Administrator</p>
                </div>
                
                {user.createdAt && (
                  <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Joined Date</p>
                    <p className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsProfileOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default AdminLayout;