import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { CreditCard, CheckCircle } from 'lucide-react';

// This would be imported from Stripe if we had it set up
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
}

const plans: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 9.99,
    interval: 'month',
    features: [
      'Up to 3 restaurant profiles',
      'No advertisements',
      'Enhanced menu analytics',
      'Priority support',
      'Unlimited menu customization'
    ]
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 99.99,
    interval: 'year',
    features: [
      'All Monthly features',
      'Save 16% compared to monthly',
      'Seasonal menu templates',
      'Advanced QR code customization',
      'API access'
    ]
  }
];

const SubscriptionPage = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>('monthly');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  
  const handleSubscribe = async () => {
    setLoadingCheckout(true);
    
    try {
      // Map selected plan to plan ID in database
      // monthly => 1, yearly => 2
      const planIdMap: Record<string, number> = {
        'monthly': 1,
        'yearly': 2
      };
      
      const planId = planIdMap[selectedPlan] || 1;
      
      // Redirect to the payment page with the selected plan ID
      setLocation(`/subscribe/${planId}`);
    } catch (error: any) {
      toast({
        title: "Subscription failed",
        description: error.message || "Please try again or contact support.",
        variant: "destructive",
      });
      setLoadingCheckout(false);
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Upgrade to Premium</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Get access to advanced features, multiple restaurant profiles, and ad-free experience.
        </p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`border rounded-xl p-6 shadow-sm transition-all ${
              selectedPlan === plan.id 
                ? 'border-primary ring-2 ring-primary ring-opacity-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <div className="mt-1 flex items-baseline">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-500 ml-1">/{plan.interval}</span>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border ${
                selectedPlan === plan.id ? 'bg-primary border-primary' : 'border-gray-300'
              }`}>
                {selectedPlan === plan.id && (
                  <CheckCircle className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
            
            <ul className="mt-6 space-y-2.5">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mr-2" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      <div className="mt-12 text-center">
        <button
          onClick={handleSubscribe}
          disabled={loadingCheckout}
          className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-lg font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loadingCheckout ? (
            <>
              <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-white border-r-2 rounded-full" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Subscribe Now
            </>
          )}
        </button>
        
        <p className="mt-3 text-sm text-gray-500">
          Secure payment processing. Cancel anytime.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;