import { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Legacy Stripe subscribe page - now redirects users to Chapa payment system
export default function Subscribe() {
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Extract planId from URL path parameters
  const pathParts = location.split('/');
  const planId = pathParts[pathParts.length - 1];
  
  useEffect(() => {
    // Show migration notice and redirect to Chapa payment
    const redirectToChapa = () => {
      setLoading(false);
      
      toast({
        title: "Payment System Updated",
        description: "We now use Chapa payment gateway. Redirecting you to the new payment system...",
      });

      // Redirect to Chapa payment page after a short delay
      setTimeout(() => {
        if (planId && planId !== 'subscribe') {
          navigate(`/chapa-subscribe/${planId}`);
        } else {
          navigate('/pricing');
        }
      }, 2000);
    };

    redirectToChapa();
  }, [planId, navigate, toast]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Payment System Updated
            </CardTitle>
            <CardDescription>
              We've upgraded to Chapa payment gateway for better service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>What's New:</strong>
                    <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                      <li>Support for telebirr and CBE Birr</li>
                      <li>Local Ethiopian payment methods</li>
                      <li>Faster and more secure payments</li>
                      <li>Licensed by National Bank of Ethiopia</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">
                    You'll be redirected to our new Chapa payment system in a moment...
                  </p>
                  
                  <Button 
                    onClick={() => {
                      if (planId && planId !== 'subscribe') {
                        navigate(`/chapa-subscribe/${planId}`);
                      } else {
                        navigate('/pricing');
                      }
                    }}
                    className="w-full"
                  >
                    Continue to New Payment System
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}