import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Read source before async work so we can use it in the success state too
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');
  const isLemonSqueezy = source === 'lemonsqueezy';

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const planId = params.get('plan');
        const currency = params.get('currency');

        console.log('Payment Success URL params:', {
          source,
          planId,
          currency,
          allParams: Object.fromEntries(params.entries()),
        });

        // Free plan — no verification needed
        if (planId === 'free') {
          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
          setLoading(false);
          return;
        }

        // Wait briefly for webhook / callback to process
        await new Promise((r) => setTimeout(r, 3000));

        try {
          const subscriptionResult = await apiRequest('GET', '/api/user/subscription-status');
          const subscriptionData = await subscriptionResult.json();

          if (subscriptionData.tier === 'free' && planId !== 'free') {
            await new Promise((r) => setTimeout(r, 2000));
            const finalCheck = await apiRequest('GET', '/api/user/subscription-status');
            const finalData = await finalCheck.json();

            if (finalData.tier === 'free' && planId !== 'free') {
              // LemonSqueezy webhooks can be slightly delayed — show success anyway
              if (isLemonSqueezy) {
                console.warn('LemonSqueezy webhook may still be processing — showing success screen anyway');
                queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
                setLoading(false);
                return;
              }
              throw new Error(
                'Payment processing is taking longer than expected. Your payment may still be processing. ' +
                'Please check your email for confirmation or contact support if the issue persists.'
              );
            }
          }

          queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
        } catch (subscriptionError: any) {
          if (isLemonSqueezy) {
            console.warn('Could not verify LS subscription status yet:', subscriptionError.message);
            queryClient.invalidateQueries({ queryKey: ['/api/user/subscription-status'] });
            setLoading(false);
            return;
          }
          throw new Error(
            'Unable to verify payment status. Please check your email for payment confirmation or contact support.'
          );
        }
      } catch (err) {
        console.error('Payment verification error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleContinue = () => {
    toast({
      title: "Success",
      description: isLemonSqueezy 
        ? "Your VividPlate Premium subscription is now active." 
        : "Your payment was successful.",
    });
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">Processing Payment</CardTitle>
            <CardDescription className="text-center">
              Please wait while we confirm your{isLemonSqueezy ? ' LemonSqueezy' : ''} payment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary my-6" />
            <p className="text-center">Confirming your subscription…</p>
            <p className="text-sm text-center text-muted-foreground mt-2">This usually takes a few seconds</p>
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
              <Button onClick={() => navigate('/ls-subscribe')} variant="outline" className="w-full">
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <div className="max-w-md w-full">
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-2xl blur-xl" />
          <Card className="relative border-green-500/30 bg-slate-900/80 backdrop-blur text-white overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400" />

            <CardHeader className="text-center pt-8">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500/30 rounded-full blur-lg animate-pulse" />
                  <CheckCircle className="relative h-20 w-20 text-green-400" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-white">🎉 You're all set!</CardTitle>
              <CardDescription className="text-slate-300 text-base mt-1">
                {isLemonSqueezy
                  ? 'Your VividPlate Premium subscription is now active'
                  : 'Your payment has been processed successfully'}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex flex-col items-center px-6 pb-8 space-y-4">
              <div className="w-full bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 text-sm text-slate-300 space-y-1.5">
                <p className="flex items-center gap-2">✅ <span>Premium plan activated</span></p>
                <p className="flex items-center gap-2">✅ <span>All features unlocked</span></p>
                <p className="flex items-center gap-2">✅ <span>Receipt sent to your email</span></p>
              </div>

              <Button
                onClick={handleContinue}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-5 rounded-xl border-0 shadow-lg shadow-orange-500/30"
              >
                Go to Dashboard
              </Button>

              {isLemonSqueezy && (
                <p className="text-xs text-slate-500 text-center">
                  Managed by LemonSqueezy · Cancel anytime from your customer portal
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}