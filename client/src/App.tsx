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
import Profile from "./pages/profile";
import CreateMenu from "./pages/create-menu";
import EditRestaurant from "./pages/edit-restaurant";
import MenuPreview from "./pages/menu-preview";
import ShareMenu from "./pages/share-menu";
import ViewMenu from "./pages/view-menu";
import Tutorial from "./pages/tutorial";
import SubscriptionPage from "./pages/subscription";
import Subscribe from "./pages/subscribe";
import PaymentSuccess from "./pages/payment-success";
import ManageUploads from "./pages/manage-uploads";
import AdminDashboard from "./pages/admin-dashboard";
import AdminLogin from "./pages/admin-login";
import AdminUsers from "./pages/admin-users";
import AdminRestaurants from "./pages/admin-restaurants";
import AdminLogs from "./pages/admin-logs";
import AdminPricing from "./pages/admin-pricing";
import AdminPricingPlans from "./pages/admin/AdminPricingPlans";
import AdminContactInfo from "./pages/admin-contact-info";
import AdminAdvertisements from "./pages/admin-advertisements";
import AdminMenuExamples from "./pages/admin-menu-examples";
import AdminTestimonials from "./pages/admin-testimonials";
import AdminAgents from "./pages/admin-agents";
import AgentRegistration from "./pages/agent-registration";
import AgentDashboard from "./pages/agent-dashboard";
import AgentCreateRestaurant from "./pages/agent-create-restaurant";
import AgentProfile from "./pages/agent-profile";
import AgentChangePassword from "./pages/agent-change-password";
import AdminTokenRequests from "./pages/admin-token-requests";
import Pricing from "./pages/pricing";
import Contact from "./pages/contact";
import ForgotPassword from "./pages/forgot-password";
import ResetPassword from "./pages/reset-password";
import PrivacyPolicy from "./pages/privacy-policy";
import CookieConsent from "@/components/ui/cookie-consent";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "./lib/queryClient";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { SubscriptionStatusProvider } from "@/hooks/use-subscription-status";
import { DietaryPreferencesProvider } from "@/hooks/use-dietary-preferences";
import AdSense from "@/components/ads/AdSense";
import TermsOfService from "./pages/terms";
import CategoriesPage from "./pages/categories";
import PasswordResetHelp from "./pages/password-reset-help";
import ChapaSubscribe from "./pages/chapa-subscribe";
import ChangePassword from "./pages/change-password";
import { PWAInstaller } from "@/components/PWAInstaller";

function AuthenticatedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return user ? <Route {...rest} component={Component} /> : null;
}

function PublicRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  return <Route {...rest} component={Component} />;
}

function AdminRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/admin-login");
    } else if (!user.isAdmin) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  return (user && user.isAdmin) ? <Route {...rest} component={Component} /> : null;
}

function Router() {
  const { isLoading } = useAuth();
  const [location] = useLocation();
  const [showLoadingTimeout, setShowLoadingTimeout] = useState(false);
  const isPublicMenuView = location.startsWith("/menu/") || location.startsWith("/view-menu/");
  const isPublicRoute = location === "/" || location.startsWith("/login") || location.startsWith("/register") || 
                       location.startsWith("/pricing") || location.startsWith("/contact") || 
                       location.startsWith("/privacy-policy") || location.startsWith("/terms") ||
                       location.startsWith("/forgot-password") || location.startsWith("/reset-password") ||
                       location.startsWith("/admin-login") || isPublicMenuView;

  // Add timeout for loading state to prevent infinite loading, but skip for public routes
  useEffect(() => {
    if (isLoading && !isPublicRoute) {
      const timer = setTimeout(() => {
        setShowLoadingTimeout(true);
      }, 15000); // 15 second timeout
      
      return () => clearTimeout(timer);
    } else {
      setShowLoadingTimeout(false);
    }
  }, [isLoading, isPublicRoute]);

  // Show timeout message if loading takes too long (but not on public routes)
  if (isLoading && showLoadingTimeout && !isPublicRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading VividPlate...</h2>
          <p className="text-muted-foreground mb-4">This is taking longer than expected.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mr-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh Page
          </button>
          <button 
            onClick={() => window.location.href = "/login"} 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Switch>
        <PublicRoute path="/" component={Home} />
        <PublicRoute path="/login" component={Login} />
        <PublicRoute path="/admin-login" component={AdminLogin} />
        <PublicRoute path="/register" component={Register} />
        <PublicRoute path="/forgot-password" component={ForgotPassword} />
        <PublicRoute path="/reset-password" component={ResetPassword} />
        <PublicRoute path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <PublicRoute path="/pricing" component={Pricing} />
        <PublicRoute path="/contact" component={Contact} />
        <PublicRoute path="/password-reset-help" component={PasswordResetHelp} />
        <PublicRoute path="/menu/:restaurantName" component={ViewMenu} />
        <PublicRoute path="/view-menu/:restaurantName" component={ViewMenu} />

        <AuthenticatedRoute path="/dashboard" component={Dashboard} />
        <AuthenticatedRoute path="/profile" component={Profile} />
        <AuthenticatedRoute path="/categories" component={CategoriesPage} />
        <AuthenticatedRoute path="/create-menu" component={CreateMenu} />
        <AuthenticatedRoute path="/edit-restaurant" component={EditRestaurant} />
        <AuthenticatedRoute path="/edit-restaurant/:restaurantId" component={EditRestaurant} />
        <AuthenticatedRoute path="/menu-preview" component={MenuPreview} />
        <AuthenticatedRoute path="/menu-preview/:restaurantId" component={MenuPreview} />
        <AuthenticatedRoute path="/share-menu" component={ShareMenu} />
        <AuthenticatedRoute path="/share-menu/:restaurantId" component={ShareMenu} />
        <AuthenticatedRoute path="/create-menu/:restaurantId" component={CreateMenu} />
        <AuthenticatedRoute path="/manage-uploads" component={ManageUploads} />
        <AuthenticatedRoute path="/manage-uploads/:restaurantId" component={ManageUploads} />
        <AuthenticatedRoute path="/tutorial" component={Tutorial} />
        <AuthenticatedRoute path="/subscription" component={SubscriptionPage} />
        <AuthenticatedRoute path="/subscribe/:planId" component={Subscribe} />
        <AuthenticatedRoute path="/subscribe" component={Subscribe} />
        <AuthenticatedRoute path="/chapa-subscribe/:planId" component={ChapaSubscribe} />
        <AuthenticatedRoute path="/payment-success" component={PaymentSuccess} />
        <AuthenticatedRoute path="/agent-registration" component={AgentRegistration} />
        <AuthenticatedRoute path="/agent-dashboard" component={AgentDashboard} />
        <AuthenticatedRoute path="/agent/create-restaurant" component={AgentCreateRestaurant} />
        <AuthenticatedRoute path="/agent/profile" component={AgentProfile} />
        <AuthenticatedRoute path="/agent/change-password" component={AgentChangePassword} />
        <AuthenticatedRoute path="/change-password" component={ChangePassword} />

        {/* Admin Routes */}
        <AdminRoute path="/admin" component={AdminDashboard} />
        <AdminRoute path="/admin/users" component={AdminUsers} />
        <AdminRoute path="/admin/restaurants" component={AdminRestaurants} />
        <AdminRoute path="/admin/pricing" component={AdminPricing} />
        <AdminRoute path="/admin/pricing-plans" component={AdminPricingPlans} />
        <AdminRoute path="/admin/logs" component={AdminLogs} />
        <AdminRoute path="/admin/profile" component={Profile} />
        <AdminRoute path="/admin/contact-info" component={AdminContactInfo} />
        <AdminRoute path="/admin/advertisements" component={AdminAdvertisements} />
        <AdminRoute path="/admin/menu-examples" component={AdminMenuExamples} />
        <AdminRoute path="/admin/testimonials" component={AdminTestimonials} />
        <AdminRoute path="/admin/agents" component={AdminAgents} />
        <AdminRoute path="/admin/token-requests" component={AdminTokenRequests} />

        <Route component={NotFound} />
      </Switch>
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
              <SubscriptionStatusProvider>
                <DietaryPreferencesProvider>
                  <Toaster />
                  <AdSense />
                  <Router />
                  <CookieConsent />
                  <PWAInstaller />
                </DietaryPreferencesProvider>
              </SubscriptionStatusProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </TooltipProvider>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;