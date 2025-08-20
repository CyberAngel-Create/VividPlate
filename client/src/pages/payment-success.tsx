import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Extract plan details from URL
        const params = new URLSearchParams(window.location.search);
        const planId = params.get('plan');
        const currency = params.get('currency');

        console.log('Payment Success URL params:', {
          planId,
          currency,
          allParams: Object.fromEntries(params.entries())
        });

        // Check if this is just a simple success redirect (for free plans)
        if (planId === 'free') {
          console.log('Free plan detected, skipping verification');
          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
          setLoading(false);
          return;
        }

        // For paid plans, wait a moment for the callback to process
        // then check subscription status
        console.log('Paid plan detected, waiting for payment processing...');
        
        // Wait 3 seconds for callback processing
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check current subscription status to see if payment was processed
        try {
          const subscriptionResult = await apiRequest('GET', '/api/user/subscription-status');
          const subscriptionData = await subscriptionResult.json();
          
          console.log('Current subscription status:', subscriptionData);
          
          // If subscription is still free after 3 seconds, payment might have failed
          if (subscriptionData.tier === 'free' && planId !== 'free') {
            // Wait another 2 seconds and check again
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const finalCheck = await apiRequest('GET', '/api/user/subscription-status');
            const finalData = await finalCheck.json();
            
            if (finalData.tier === 'free' && planId !== 'free') {
              throw new Error('Payment processing is taking longer than expected. Your payment may still be processing. Please check your email for confirmation or contact support if the issue persists.');
            }
          }
          
          // Payment successful, invalidate cache to refresh subscription
          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
          
        } catch (subscriptionError) {
          console.error('Error checking subscription status:', subscriptionError);
          throw new Error('Unable to verify payment status. Please check your email for payment confirmation or contact support.');
        }

      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  const handleContinue = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Processing Payment</CardTitle>
            <CardDescription className="text-center">
              Please wait while we confirm your Chapa payment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary my-6" />
            <p className="text-center">Processing your payment through Chapa...</p>
            <p className="text-sm text-center text-muted-foreground mt-2">
              This usually takes a few seconds
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center text-red-500">Payment Verification Failed</CardTitle>
            <CardDescription className="text-center">
              We encountered an issue while confirming your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <p className="text-center my-6">{error}</p>
            <div className="flex flex-col space-y-2 w-full">
              <Button onClick={() => navigate('/subscribe')} variant="outline" className="w-full">
                Try Again
              </Button>
              <Button onClick={() => navigate('/dashboard')} className="w-full">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-center text-green-600">Payment Successful!</CardTitle>
          <CardDescription className="text-center">
            Thank you for upgrading your subscription
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <CheckCircle className="h-16 w-16 text-green-500 my-6" />
          <p className="text-center mb-6">
            Your Chapa payment has been processed successfully. You now have access to all premium features.
          </p>
          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}