import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  adminLoginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    gcTime: 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    retry: false,
    queryFn: async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        const response = await fetch("/api/auth/me", {
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.status === 401) {
          return null; // Not authenticated, return null instead of throwing
        }
        if (!response.ok) {
          throw new Error('Authentication check failed');
        }
        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Authentication check timed out');
        }
        return null; // Return null for any authentication errors
      }
    }
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<User> => {
      // Map username to identifier as expected by the server
      const mappedCredentials = {
        identifier: credentials.username,
        password: credentials.password
      };
      const res = await apiRequest("POST", "/api/auth/login", mappedCredentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }
      return await res.json();
    },
    onSuccess: async (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/user/subscription-status"] });
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName || user.username}!`,
      });
      
      // Check if user is an agent and redirect accordingly
      try {
        const agentRes = await fetch("/api/agents/me", { credentials: 'include' });
        if (agentRes.ok) {
          const agent = await agentRes.json();
          if (agent && agent.approvalStatus === 'approved') {
            setTimeout(() => {
              setLocation("/agent-dashboard");
            }, 100);
            return;
          }
        }
      } catch (e) {
        // Not an agent, proceed to regular dashboard
      }
      
      // Use setTimeout to ensure state updates have propagated
      setTimeout(() => {
        setLocation("/dashboard");
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<User> => {
      // Map username to identifier as expected by the server
      const mappedCredentials = {
        identifier: credentials.username,
        password: credentials.password
      };
      const res = await apiRequest("POST", "/api/auth/admin-login", mappedCredentials);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Admin login failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      setLocation("/admin");
      toast({
        title: "Admin login successful",
        description: "Welcome to the admin dashboard",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Admin login failed",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<User> => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/me"], user);
      setLocation("/dashboard");
      toast({
        title: "Registration successful",
        description: `Welcome to VividPlate, ${user.fullName || user.username}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Logout failed");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      
      // Use setTimeout to ensure cache is cleared before redirect
      setTimeout(() => {
        setLocation("/login");
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        adminLoginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}