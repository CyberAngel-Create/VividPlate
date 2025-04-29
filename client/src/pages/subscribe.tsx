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
        <p className="text-2xl font-bold">${planPrice} <span className="text-sm font-normal text-muted-foreground">/ year</span></p>
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
  const [planId, setPlanId] = useState<string>("yearly");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Plan details
  const plans = {
    yearly: { 
      name: "Premium Yearly", 
      price: "99.99", 
      description: "Ad-free menus, up to 3 restaurants, unlimited menu items"
    }
  };

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setLoading(true);
        const response = await apiRequest("POST", "/api/create-subscription", { 
          planId
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error creating subscription");
        }

        const data = await response.json();
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

    fetchPaymentIntent();
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

  const selectedPlan = plans[planId as keyof typeof plans];

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
          {clientSecret ? (
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
                planName={selectedPlan.name} 
                planPrice={selectedPlan.price} 
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