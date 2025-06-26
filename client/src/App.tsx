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
import AdminContactInfo from "./pages/admin-contact-info";
import AdminAdvertisements from "./pages/admin-advertisements";
import AdminMenuExamples from "./pages/admin-menu-examples";
import AdminTestimonials from "./pages/admin-testimonials";
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
import { SubscriptionProvider } from "@/hooks/use-subscription";
import { SubscriptionStatusProvider } from "@/hooks/use-subscription-status";
import { DietaryPreferencesProvider } from "@/hooks/use-dietary-preferences";
import AdSense from "@/components/ads/AdSense";
import TermsOfService from "./pages/terms";

function AuthenticatedRoute({ component: Component, ...rest }: { component: React.ComponentType<any>, path: string }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  // Always render the route to prevent loading states
  return <Route {...rest} component={user ? Component : () => null} />;
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

  // Always render the route to prevent loading states
  return <Route {...rest} component={(user && user.isAdmin) ? Component : () => null} />;
}

function Router() {
  const [location] = useLocation();
  const isPublicMenuView = location.startsWith("/menu/") || location.startsWith("/view-menu/");

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
        <PublicRoute path="/menu/:restaurantName" component={ViewMenu} />
        <PublicRoute path="/view-menu/:restaurantName" component={ViewMenu} />

        <AuthenticatedRoute path="/dashboard" component={Dashboard} />
        <AuthenticatedRoute path="/profile" component={Profile} />
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
        <AuthenticatedRoute path="/payment-success" component={PaymentSuccess} />

        {/* Admin Routes */}
        <AdminRoute path="/admin" component={AdminDashboard} />
        <AdminRoute path="/admin/users" component={AdminUsers} />
        <AdminRoute path="/admin/restaurants" component={AdminRestaurants} />
        <AdminRoute path="/admin/pricing" component={AdminPricing} />
        <AdminRoute path="/admin/logs" component={AdminLogs} />
        <AdminRoute path="/admin/profile" component={Profile} />
        <AdminRoute path="/admin/contact-info" component={AdminContactInfo} />
        <AdminRoute path="/admin/advertisements" component={AdminAdvertisements} />
        <AdminRoute path="/admin/menu-examples" component={AdminMenuExamples} />
        <AdminRoute path="/admin/testimonials" component={AdminTestimonials} />

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