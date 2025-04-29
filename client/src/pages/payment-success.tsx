import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [location] = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Extract payment_intent from URL if it exists
        const params = new URLSearchParams(window.location.search);
        const paymentIntentId = params.get('payment_intent');

        if (!paymentIntentId) {
          throw new Error('No payment information found');
        }

        // Verify the payment with the server
        const result = await apiRequest('POST', '/api/verify-payment', {
          paymentIntentId
        });

        if (!result.ok) {
          const errorData = await result.json();
          throw new Error(errorData.message || 'Failed to verify payment');
        }

        // Invalidate subscription status to refresh it
        queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [location]);

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
            Thank you for upgrading to Premium
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <CheckCircle className="h-16 w-16 text-green-500 my-6" />
          <p className="text-center mb-6">
            Your payment has been processed successfully. You now have access to all premium features.
          </p>
          <Button onClick={handleContinue} className="w-full">
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}