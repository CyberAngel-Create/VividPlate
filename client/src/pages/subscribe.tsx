import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = ({ planName, planPrice }: { planName: string, planPrice: string }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/payment-success',
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Successful",
          description: "You are now subscribed!",
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error("Error processing payment:", err);
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted p-6 rounded-lg mb-6">
        <h3 className="font-semibold text-lg mb-2">{planName}</h3>
        <p className="text-2xl font-bold">${planPrice}</p>
      </div>
      
      <div className="space-y-4">
        <PaymentElement />
      </div>
      
      <Button 
        type="submit" 
        className="w-full font-semibold" 
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${planPrice}`
        )}
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState<{ name: string; price: string; description: string; id: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Extract planId from URL path parameters
  const pathParts = location.split('/');
  // Get the last part of the URL path which should be the planId
  const planId = pathParts[pathParts.length - 1];
  
  // Check if planId is a number, if not it might be "/subscribe" without an ID
  const isValidPlanId = /^\d+$/.test(planId);

  useEffect(() => {
    const fetchPlanAndSetupPayment = async () => {
      if (!isValidPlanId) {
        // Redirect to pricing page instead of showing error
        window.location.href = '/subscription';
        return;
      }

      try {
        setLoading(true);
        
        // First, fetch the plan details
        const planResponse = await apiRequest("GET", `/api/pricing/${planId}`);
        if (!planResponse.ok) {
          throw new Error("Selected plan not found");
        }
        
        const planDetails = await planResponse.json();
        setPlanData(planDetails);
        
        // Then create the subscription with the plan ID
        const subscriptionResponse = await apiRequest("POST", "/api/create-subscription", { 
          planId: parseInt(planId, 10)
        });
        
        if (!subscriptionResponse.ok) {
          const errorData = await subscriptionResponse.json();
          throw new Error(errorData.message || "Error creating subscription");
        }

        const data = await subscriptionResponse.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Subscription error:", err);
        setError(`Failed to setup payment: ${err instanceof Error ? err.message : 'Unknown error'}`);
        toast({
          title: "Error",
          description: "Could not set up payment. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlanAndSetupPayment();
  }, [planId, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Payment Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Complete Your Subscription</CardTitle>
          <CardDescription>
            Enter your payment details to upgrade to Premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientSecret && planData ? (
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#ff5733',
                  }
                }
              }}
            >
              <SubscribeForm 
                planName={planData.name} 
                planPrice={planData.price} 
              />
            </Elements>
          ) : (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">Preparing payment form...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}