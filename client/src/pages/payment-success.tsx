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
        // Extract Chapa transaction details from URL
        const params = new URLSearchParams(window.location.search);
        const txRef = params.get('trx_ref') || params.get('tx_ref') || params.get('reference');
        const status = params.get('status');
        const planId = params.get('plan');

        console.log('Payment Success URL params:', {
          txRef,
          status,
          planId,
          allParams: Object.fromEntries(params.entries())
        });

        // Check if this is just a simple success redirect (for free plans)
        if (planId === 'free' && status !== 'failed') {
          console.log('Free plan detected, skipping verification');
          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
          setLoading(false);
          return;
        }

        if (!txRef) {
          console.error('No transaction reference found in URL params:', Object.fromEntries(params.entries()));
          throw new Error('No payment transaction reference found. Please check your payment confirmation email or contact support.');
        }

        // Verify the payment with Chapa
        const result = await apiRequest('POST', '/api/chapa/verify-payment', {
          txRef,
          planId
        });

        const resultData = await result.json();

        if (!result.ok) {
          throw new Error(resultData.message || 'Failed to verify payment');
        }

        if (resultData.status === 'success') {
          // Payment successful, invalidate cache to refresh subscription
          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
        } else {
          throw new Error(resultData.message || 'Payment verification failed');
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
              Please wait while we confirm your payment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary my-6" />
            <p className="text-center">This may take a moment...</p>
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