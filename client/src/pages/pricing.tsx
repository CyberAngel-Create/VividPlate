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
import { apiRequest } from "@/lib/queryClient";

interface PricingPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  isPopular: boolean;
  isActive: boolean;
  features: string[];
  tier: string;
  billingPeriod: string;
}

const PricingPage = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();

  const { data: plans, isLoading, error } = useQuery<PricingPlan[]>({
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

  const handleSubscribe = (plan: PricingPlan) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in or register to subscribe to this plan.",
      });
      setLocation("/login?redirect=/pricing");
      return;
    }

    if (plan.tier === 'free') {
      // For free plan, just show a success message
      toast({
        title: "Free plan activated",
        description: "You are now on the free plan.",
      });
    } else {
      // For paid plans, go to subscribe page
      setLocation("/subscribe");
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
              {plans?.filter(plan => plan.isActive).map((plan) => (
                <Card 
                  key={plan.id} 
                  className={`border-2 flex flex-col ${plan.isPopular ? 'border-primary shadow-lg relative' : 'border-border'}`}
                >
                  {plan.isPopular && (
                    <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="pb-8">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription className="mt-2">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">
                        {plan.currency === 'USD' ? '$' : plan.currency} {plan.price}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.price > 0 ? `/${plan.billingPeriod}` : ''}
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
                      variant={plan.isPopular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {plan.tier === 'free' ? 'Get Started' : 'Subscribe Now'}
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