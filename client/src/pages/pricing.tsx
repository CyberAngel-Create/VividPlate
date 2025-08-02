import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Check, Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import CustomerHeader from "@/components/layout/CustomerHeader";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";

interface PricingPlan {
  name: string;
  description: string;
  price: number;
  currency: string;
  popular: boolean;
  features: string[];
  maxRestaurants: number;
  maxMenuItems: number;
  international?: boolean;
  internationalPricing?: Record<string, number>;
  originalPrice?: number;
  originalCurrency?: string;
}

const PricingPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { subscription, isPaid, isLoading: isSubscriptionLoading } = useSubscription();
  const { t } = useTranslation();

  const { data: plans, isLoading, error } = useQuery<Record<string, PricingPlan>>({
    queryKey: ["/api/pricing"],
    retry: 1,
    gcTime: 0,
  });

  // Show error notification
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load pricing plans. Please try again later.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handleSubscribe = async (plan: PricingPlan, planKey: string) => {
    if (!user) {
      toast({
        title: t("Authentication required"),
        description: t("Please log in or register to subscribe to this plan."),
      });
      setLocation("/login?redirect=/pricing");
      return;
    }

    // If user is already on a paid plan and tries to select another paid plan
    if (isPaid && planKey !== 'free') {
      // Check if they're trying to select the same plan they already have
      if (subscription?.tier === planKey) {
        toast({
          title: t("Already subscribed"),
          description: t("You are already subscribed to this plan."),
        });
        return;
      }
      
      // If it's a different paid plan, allow the change
      setLocation(`/chapa-subscribe/${planKey}`);
      return;
    }

    if (planKey === 'free') {
      try {
        // For downgrading to free plan, make an API call to update the subscription
        await apiRequest("POST", "/api/subscription/downgrade", {});
        toast({
          title: t("Plan changed"),
          description: t("You have been downgraded to the free plan."),
        });
        // Redirect to dashboard after downgrading
        setLocation("/dashboard");
      } catch (error) {
        toast({
          title: t("Error"),
          description: t("Failed to change your subscription plan. Please try again."),
          variant: "destructive",
        });
      }
    } else {
      // For upgrading to paid plans, go to Chapa subscribe page
      setLocation(`/chapa-subscribe/${planKey}`);
    }
  };

  // Create a logout handler
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <CustomerHeader 
        isAuthenticated={!!user}
        onLogout={handleLogout}
      />
      <main className="flex-1 container mx-auto px-4 py-12">
        {isLoading || isAuthLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <section className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Pricing Plans</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Choose the perfect plan for your restaurant. Upgrade anytime to access premium features.
              </p>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans && Object.entries(plans).map(([planKey, plan]: [string, any]) => (
                <Card 
                  key={planKey} 
                  className={`border-2 flex flex-col ${plan.popular ? 'border-primary shadow-lg relative' : 'border-border'}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.currency === 'USD' ? '$' : plan.currency === 'EUR' ? '€' : plan.currency === 'GBP' ? '£' : plan.currency + ' '} {plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.price > 0 ? '/month' : ''}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <h4 className="font-medium mb-4">Features</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-6">
                    <Button 
                      className="w-full" 
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan, planKey)}
                      disabled={isSubscriptionLoading}
                    >
                      {(() => {
                        // Already subscribed to this specific plan
                        if (subscription?.tier === planKey) {
                          return t("Current Plan");
                        }
                        
                        // Free plan options
                        if (planKey === 'free') {
                          return isPaid ? t("Downgrade to Free") : t("Get Started");
                        }
                        
                        // Paid plan options
                        return isPaid ? t("Switch Plan") : t("Subscribe Now");
                      })()}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;