import { ReactNode } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import AgentSidebar from "./AgentSidebar";

interface AgentLayoutProps {
  children: ReactNode;
}

const AgentLayout = ({ children }: AgentLayoutProps) => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Success",
        description: "Logged out successfully",
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

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      <AgentSidebar onLogout={handleLogout} />
      
      <main className="flex-1 w-full min-h-screen">
        <div className="pt-16 lg:pt-0 lg:pl-60">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AgentLayout;
