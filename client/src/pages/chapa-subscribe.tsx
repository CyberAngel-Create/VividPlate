import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Smartphone, Building2, Check, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SubscriptionPlan {
  name: string;
  price: number;
  currency: string;
  description: string;
  features: string[];
  maxRestaurants: number;
  maxMenuItems: number;
  international?: boolean;
  internationalPricing?: Record<string, number>;
  originalPrice?: number;
  originalCurrency?: string;
}

interface PaymentFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  currency?: string;
  countryCode?: string;
}

const PaymentForm = ({ plan, onSubmit, isProcessing }: { 
  plan: SubscriptionPlan; 
  onSubmit: (data: PaymentFormData) => void;
  isProcessing: boolean;
}) => {
  const [formData, setFormData] = useState<PaymentFormData>({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.email || !formData.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted p-6 rounded-lg mb-6">
        <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {plan.name} Plan
        </h3>
        <p className="text-2xl font-bold text-primary">
          {plan.price} {plan.currency} {plan.price > 0 && '/month'}
        </p>
        <p className="text-muted-foreground mt-2">{plan.description}</p>
        
        <div className="mt-4">
          <h4 className="font-medium mb-2">Included Features:</h4>
          <ul className="space-y-1">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-600" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          You'll be redirected to Chapa's secure payment page. Chapa supports telebirr, CBE Birr, 
          Visa, Mastercard, and bank transfers.
        </AlertDescription>
      </Alert>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              className={errors.firstName ? 'border-red-500' : ''}
              placeholder="Enter your first name"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              type="text"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              className={errors.lastName ? 'border-red-500' : ''}
              placeholder="Enter your last name"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={errors.email ? 'border-red-500' : ''}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phoneNumber">Phone Number *</Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className={errors.phoneNumber ? 'border-red-500' : ''}
            placeholder="+251XXXXXXXXX or 09XXXXXXXX"
          />
          {errors.phoneNumber && (
            <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            Ethiopian phone number (supports +251, 0 prefix, or local format)
          </p>
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full font-semibold" 
        disabled={isProcessing}
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {plan.price > 0 ? `Pay ${plan.price} ${plan.currency}` : 'Continue with Free Plan'}
          </>
        )}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        <p>Secure payment powered by Chapa</p>
        <p>Licensed by National Bank of Ethiopia</p>
      </div>
    </form>
  );
};

export default function ChapaSubscribe() {
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState<SubscriptionPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  
  // Extract planId from URL path parameters
  const pathParts = location.split('/');
  const planId = pathParts[pathParts.length - 1];
  
  useEffect(() => {
    const fetchPlanData = async () => {
      try {
        if (!planId || planId === 'chapa-subscribe') {
          setError('Invalid subscription plan selected');
          setLoading(false);
          return;
        }

        console.log('Fetching plan data for planId:', planId);
        
        // Get user's currency and location if available
        const userCountry = navigator.language.split('-')[1] || 'ET';
        const response = await apiRequest('GET', `/api/chapa/subscription-plans?currency=ETB&country=${userCountry}`);
        console.log('Plan data response:', response);
        const responseData = await response.json();
        console.log('Plan data parsed:', responseData);
        
        if (responseData && responseData.plans && responseData.plans[planId]) {
          setPlanData(responseData.plans[planId]);
        } else {
          setError('Subscription plan not found');
        }
      } catch (err) {
        console.error('Error fetching plan data:', err);
        setError('Failed to load subscription plan details');
      } finally {
        setLoading(false);
      }
    };

    fetchPlanData();
  }, [planId]);

  const handlePaymentSubmit = async (formData: PaymentFormData) => {
    if (!planData) return;

    setIsProcessing(true);

    try {
      console.log('Initiating Chapa payment for plan:', planData.name);
      
      // Get user's currency and location
      const userCountry = navigator.language.split('-')[1] || 'ET';
      
      // Call backend to initialize Chapa payment
      const response = await apiRequest('POST', `/api/chapa/initialize-payment/${planId}`, {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        currency: planData.currency,
        countryCode: userCountry
      });

      console.log('Chapa initialization response:', response);
      const responseData = await response.json();
      console.log('Chapa initialization parsed:', responseData);

      if (responseData.status === 'success' && responseData.data.checkout_url) {
        toast({
          title: "Redirecting to Payment",
          description: "You will be redirected to Chapa's secure payment page.",
        });

        // Redirect to Chapa checkout page
        window.location.href = responseData.data.checkout_url;
      } else {
        throw new Error(responseData.message || 'Failed to initialize payment');
      }

    } catch (err: any) {
      console.error("Error initializing payment:", err);
      toast({
        title: "Payment Initialization Failed",
        description: err.message || "There was an error setting up your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <p className="text-center mt-4">Loading subscription details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              onClick={() => navigate('/pricing')} 
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <p className="text-center">Subscription plan not found.</p>
            <Button 
              onClick={() => navigate('/pricing')} 
              variant="outline"
              className="w-full mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Pricing
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pricing')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Button>
          
          <h1 className="text-2xl font-bold text-center mb-2">
            Complete Your Subscription
          </h1>
          <p className="text-muted-foreground text-center">
            Subscribe to {planData.name} plan and unlock powerful features
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Details
            </CardTitle>
            <CardDescription>
              Secure payment processing powered by Chapa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm 
              plan={planData} 
              onSubmit={handlePaymentSubmit}
              isProcessing={isProcessing}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}