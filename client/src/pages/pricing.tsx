import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Check, X, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TabNavigation from "@/components/layout/TabNavigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: {
    included: string[];
    excluded: string[];
  };
  buttonText: string;
  popular?: boolean;
}

const Pricing = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Pricing tiers data
  const pricingTiers: PricingTier[] = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for getting started with your digital menu",
      features: {
        included: [
          "1 restaurant profile",
          "Unlimited menu items",
          "QR code generation",
          "Mobile-responsive design",
          "Customer feedback collection"
        ],
        excluded: [
          "No ads on menu pages",
          "Multiple restaurant profiles",
          "Priority support"
        ]
      },
      buttonText: "Get Started",
    },
    {
      name: "Premium",
      price: "$9.99",
      description: "For restaurants wanting more flexibility and professional appearance",
      features: {
        included: [
          "Up to 3 restaurant profiles",
          "Unlimited menu items",
          "QR code generation",
          "Mobile-responsive design",
          "No ads on menu pages",
          "Customer feedback collection",
          "Priority support"
        ],
        excluded: []
      },
      buttonText: "Upgrade Now",
      popular: true
    }
  ];
  
  const handleSelectPlan = (planName: string) => {
    if (planName === "Free") {
      setLocation("/register");
    } else {
      // Now redirecting to the Stripe payment flow for Premium
      setLocation("/subscribe");
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <TabNavigation />
      
      <section className="container px-4 py-12 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Choose the plan that best fits your restaurant's needs. No hidden fees or complicated pricing structures.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingTiers.map((tier) => (
            <Card 
              key={tier.name} 
              className={`border-2 ${
                tier.popular 
                  ? 'border-primary shadow-lg relative overflow-hidden' 
                  : 'border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-primary text-white py-1 px-3 text-xs font-medium rounded-bl-md">
                  Most Popular
                </div>
              )}
              
              <CardHeader>
                <CardTitle className="text-2xl font-heading">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  {tier.name !== "Free" && <span className="text-gray-500 ml-1">/month</span>}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <h4 className="font-medium text-sm">What's included:</h4>
                <ul className="space-y-2">
                  {tier.features.included.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <div className="mr-2 mt-0.5 text-green-500 flex-shrink-0">
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                  
                  {tier.features.excluded.map((feature) => (
                    <li key={feature} className="flex items-start text-gray-400">
                      <div className="mr-2 mt-0.5 text-gray-400 flex-shrink-0">
                        <X className="h-4 w-4" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className={`w-full ${
                    tier.popular 
                      ? 'bg-primary hover:bg-primary/90' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  onClick={() => handleSelectPlan(tier.name)}
                >
                  {tier.name === "Premium" && (
                    <CreditCard className="mr-2 h-4 w-4" />
                  )}
                  {tier.buttonText}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        <div className="max-w-3xl mx-auto mt-16 text-center">
          <h2 className="text-xl font-heading font-semibold mb-4">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="space-y-1">
              <h3 className="text-base font-medium">Can I upgrade or downgrade my plan?</h3>
              <p className="text-sm text-gray-600">
                Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated amount.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium">Do I need to enter my credit card for the free plan?</h3>
              <p className="text-sm text-gray-600">
                No, the free plan is completely free and doesn't require any payment information.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium">What payment methods do you accept?</h3>
              <p className="text-sm text-gray-600">
                We accept all major credit cards and local payment options including Telebirr for Ethiopian customers.
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-medium">Is there a contract or commitment?</h3>
              <p className="text-sm text-gray-600">
                No, all plans are billed monthly and you can cancel at any time without penalties.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;