
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiRequest('GET', '/api/auth/me');
      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiRequest('POST', '/api/auth/login', { identifier, password });
      const userData = await response.json();
      setUser(userData);
      setIsAuthenticated(true);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${userData.fullName || userData.username}!`,
      });
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setError(err instanceof Error ? err : new Error('Login failed'));
      toast({
        title: 'Login failed',
        description: err instanceof Error ? err.message : 'Please check your credentials and try again',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Logout failed'));
      toast({
        title: 'Logout failed',
        description: err instanceof Error ? err.message : 'An error occurred during logout',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const newUser = await response.json();
      setUser(newUser);
      setIsAuthenticated(true);
      toast({
        title: 'Registration successful',
        description: `Welcome to DigitaMenuMate, ${newUser.fullName || newUser.username}!`,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Registration failed'));
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Please check your information and try again',
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    refreshUser
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
