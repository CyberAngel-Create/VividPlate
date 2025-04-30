import { Switch, Route, RouteComponentProps } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from "react-helmet-async";
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
import Subscribe from "./pages/subscribe";
import PaymentSuccess from "./pages/payment-success";
import AdminDashboard from "./pages/admin-dashboard";
import AdminLogin from "./pages/admin-login";
import Pricing from "./pages/pricing";
import Contact from "./pages/contact";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "./lib/queryClient";
import { AuthProvider } from "@/hooks/use-auth";
import { SubscriptionProvider } from "@/hooks/use-subscription";

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
          <PublicRoute path="/forgot-password" component={ForgotPassword} />
          <PublicRoute path="/reset-password" component={ResetPassword} />
          <PublicRoute path="/pricing" component={Pricing} />
          <PublicRoute path="/contact" component={Contact} />
          <PublicRoute path="/menu/:restaurantId" component={ViewMenu} />
          <PublicRoute path="/view-menu/:restaurantId" component={ViewMenu} />

          <AuthenticatedRoute path="/dashboard" component={Dashboard} />
          <AuthenticatedRoute path="/create-menu" component={CreateMenu} />
          <AuthenticatedRoute path="/edit-restaurant" component={EditRestaurant} />
          <AuthenticatedRoute path="/menu-preview" component={MenuPreview} />
          <AuthenticatedRoute path="/share-menu" component={ShareMenu} />
          <AuthenticatedRoute path="/subscription" component={SubscriptionPage} />
          <AuthenticatedRoute path="/subscribe" component={Subscribe} />
          <AuthenticatedRoute path="/payment-success" component={PaymentSuccess} />

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
      <HelmetProvider>
        <TooltipProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <Toaster />
              <Router />
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;