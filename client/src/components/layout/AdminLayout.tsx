import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { 
  Users, 
  BarChart3, 
  Settings, 
  Store, 
  ClipboardCheck, 
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children: ReactNode;
}

const SidebarItem = ({
  icon,
  label,
  active,
  href,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  href: string;
}) => {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
        active
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logoutMutation } = useAuth();

  // Check if user is an admin
  if (!user || !user.isAdmin) {
    return <Redirect to="/" />;
  }

  // Paths could be expanded as needed
  const sidebarItems = [
    {
      icon: <BarChart3 className="w-5 h-5" />,
      label: "Dashboard",
      href: "/admin",
      active: window.location.pathname === "/admin" || window.location.pathname === "/admin-dashboard",
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: "Users",
      href: "/admin?tab=users",
      active: window.location.search.includes("tab=users"),
    },
    {
      icon: <Store className="w-5 h-5" />,
      label: "Restaurants",
      href: "/admin?tab=restaurants",
      active: window.location.search.includes("tab=restaurants"),
    },
    {
      icon: <ClipboardCheck className="w-5 h-5" />,
      label: "Subscriptions",
      href: "/admin?tab=subscriptions",
      active: window.location.search.includes("tab=subscriptions"),
    },
    {
      icon: <Settings className="w-5 h-5" />,
      label: "Settings",
      href: "/admin?tab=settings",
      active: window.location.search.includes("tab=settings"),
    },
  ];

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="grid grid-cols-[260px_1fr] min-h-screen">
      {/* Sidebar */}
      <div className="bg-card border-r border-border flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">
            DigitalMenuMate
          </p>
        </div>
        
        <Separator />
        
        <ScrollArea className="flex-1 py-3">
          <nav className="grid gap-1 px-2">
            {sidebarItems.map((item, index) => (
              <SidebarItem
                key={index}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={item.active}
              />
            ))}
          </nav>
        </ScrollArea>
        
        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <main className="bg-background">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;