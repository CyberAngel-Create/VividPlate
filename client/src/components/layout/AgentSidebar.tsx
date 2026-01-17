import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Store, LogOut, Menu, Coins, Plus, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useQuery } from "@tanstack/react-query";

interface AgentSidebarProps {
  onLogout?: () => void;
}

type NavItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  path: string;
};

const AgentSidebar = ({ onLogout = () => {} }: AgentSidebarProps) => {
  const [location, setLocation] = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: agent } = useQuery<{ tokenBalance: number } | null>({
    queryKey: ["/api/agents/me"],
    retry: false,
  });

  const hasTokens = agent && agent.tokenBalance > 0;

  const navItems: NavItem[] = [
    { 
      id: 'agent-dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" />, 
      label: 'Dashboard', 
      path: '/agent-dashboard' 
    },
    { 
      id: 'create-restaurant', 
      icon: hasTokens ? <Plus className="h-5 w-5" /> : <Lock className="h-5 w-5" />, 
      label: 'Create Restaurant', 
      path: '/agent/create-restaurant'
    },
    {
      id: 'profile',
      icon: <User className="h-5 w-5" />,
      label: 'Profile',
      path: '/profile'
    },
    {
      id: 'change-password',
      icon: <Lock className="h-5 w-5" />,
      label: 'Change Password',
      path: '/change-password'
    },
  ];

  const isActive = (path: string) => {
    return location === path;
  };

  const handleNavigation = (path: string) => {
    setLocation(path);
    setIsMobileSidebarOpen(false);
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 h-16">
        <Link href="/agent-dashboard">
          <div>
            <span className="text-xl font-heading font-bold text-primary dark:text-primary-light">VividPlate</span>
            <span className="ml-2 text-sm font-medium text-amber-600 dark:text-amber-400">Agent</span>
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
                  <span className="text-lg font-heading font-bold text-primary dark:text-primary-light">VividPlate</span>
                  <span className="ml-2 text-sm font-medium text-amber-600 dark:text-amber-400">Agent</span>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-2">
                    {navItems.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleNavigation(item.path)}
                          disabled={item.id === 'create-restaurant' && !hasTokens}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                            item.id === 'create-restaurant' && !hasTokens
                              ? 'text-gray-400 cursor-not-allowed'
                              : isActive(item.path)
                              ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light font-medium'
                              : 'text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary-light dark:hover:bg-gray-800'
                          }`}
                        >
                          {item.icon}
                          <span className="whitespace-nowrap text-left">{item.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
                
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
    
      <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 bottom-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40">
        <div className="p-4 border-b dark:border-gray-800">
          <Link href="/agent-dashboard">
            <span className="text-xl font-heading font-bold text-primary dark:text-primary-light">VividPlate</span>
            <span className="ml-2 text-sm font-medium text-amber-600 dark:text-amber-400">Agent</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  disabled={item.id === 'create-restaurant' && !hasTokens}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                    item.id === 'create-restaurant' && !hasTokens
                      ? 'text-gray-400 cursor-not-allowed'
                      : isActive(item.path)
                      ? 'bg-primary/10 text-primary dark:bg-primary-dark/20 dark:text-primary-light font-medium'
                      : 'text-gray-700 hover:text-primary hover:bg-gray-100 dark:text-gray-300 dark:hover:text-primary-light dark:hover:bg-gray-800'
                  }`}
                >
                  {item.icon}
                  <span className="whitespace-nowrap">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
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
    </>
  );
};

export default AgentSidebar;
