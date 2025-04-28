import { Switch, Route, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/not-found";
import Home from "./pages/home";
import Login from "./pages/login";
import Register from "./pages/register";
import Dashboard from "./pages/dashboard";
import CreateMenu from "./pages/create-menu";
import EditRestaurant from "./pages/edit-restaurant";
import MenuPreview from "./pages/menu-preview";
import ShareMenu from "./pages/share-menu";
import ViewMenu from "./pages/view-menu";
import SubscriptionPage from "./pages/subscription";
import AdminDashboard from "./pages/admin-dashboard";
import AdminLogin from "./pages/admin-login";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "./lib/queryClient";

function AuthenticatedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await apiRequest("GET", "/api/auth/me");
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        setLocation("/login");
      }
    };
    
    checkAuth();
  }, [setLocation]);

  if (isAuthenticated === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return <Route {...rest} component={Component} />;
}

function PublicRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  return <Route {...rest} component={Component} />;
}

function AdminRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const response = await apiRequest("GET", "/api/auth/me");
        const userData = await response.json();
        if (userData.isAdmin) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
          setLocation("/dashboard");
        }
      } catch (error) {
        setIsAdmin(false);
        setLocation("/login");
      }
    };
    
    checkAdminStatus();
  }, [setLocation]);

  if (isAdmin === null) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return <Route {...rest} component={Component} />;
}

function Router() {
  const [location] = useLocation();
  const isPublicMenuView = location.startsWith("/menu/") || location.startsWith("/view-menu/");

  return (
    <div className="flex flex-col min-h-screen">
      {!isPublicMenuView && <Header />}
      
      <main className="flex-grow">
        <Switch>
          <PublicRoute path="/" component={Home} />
          <PublicRoute path="/login" component={Login} />
          <PublicRoute path="/admin-login" component={AdminLogin} />
          <PublicRoute path="/register" component={Register} />
          <PublicRoute path="/menu/:restaurantId" component={ViewMenu} />
          <PublicRoute path="/view-menu/:restaurantId" component={ViewMenu} />
          
          <AuthenticatedRoute path="/dashboard" component={Dashboard} />
          <AuthenticatedRoute path="/create-menu" component={CreateMenu} />
          <AuthenticatedRoute path="/edit-restaurant" component={EditRestaurant} />
          <AuthenticatedRoute path="/menu-preview" component={MenuPreview} />
          <AuthenticatedRoute path="/share-menu" component={ShareMenu} />
          <AuthenticatedRoute path="/subscription" component={SubscriptionPage} />
          
          {/* Admin Routes */}
          <AdminRoute path="/admin" component={AdminDashboard} />
          
          <Route component={NotFound} />
        </Switch>
      </main>
      
      {!isPublicMenuView && <Footer />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
