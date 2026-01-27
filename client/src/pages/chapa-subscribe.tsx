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
  paymentMethod?: string;
  // Card details for international payments
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
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
    phoneNumber: '',
    paymentMethod: 'local'
  });

  const [selectedCurrency, setSelectedCurrency] = useState<string>('ETB');

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

    // Additional validation for international payment method
    if (formData.paymentMethod === 'international') {
      if (!formData.cardholderName?.trim()) {
        newErrors.cardholderName = 'Cardholder name is required';
      }

      if (!formData.cardNumber?.trim()) {
        newErrors.cardNumber = 'Card number is required';
      } else if (formData.cardNumber.replace(/\s/g, '').length < 13) {
        newErrors.cardNumber = 'Card number must be at least 13 digits';
      }

      if (!formData.expiryDate?.trim()) {
        newErrors.expiryDate = 'Expiry date is required';
      } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Invalid expiry date (MM/YY)';
      }

      if (!formData.cvv?.trim()) {
        newErrors.cvv = 'CVV is required';
      } else if (formData.cvv.length < 3) {
        newErrors.cvv = 'CVV must be 3-4 digits';
      }
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

    // Update currency when payment method changes
    if (field === 'paymentMethod') {
      if (value === 'local') {
        setSelectedCurrency('ETB');
        // Clear card fields when switching to local
        setFormData(prev => ({
          ...prev,
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        }));
      } else {
        setSelectedCurrency(plan.currency || 'USD');
      }
    }

    // Format card number with spaces
    if (field === 'cardNumber') {
      value = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
    }

    // Format expiry date
    if (field === 'expiryDate') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(\d{2})/, '$1/$2').substr(0, 5);
    }

    // Format CVV (numbers only)
    if (field === 'cvv') {
      value = value.replace(/\D/g, '');
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
          {formData.paymentMethod === 'local' 
            ? `${plan.originalPrice || plan.price} ETB`
            : `${plan.price} ${plan.currency}`
          } {plan.price > 0 && '/month'}
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

      {/* Payment Method Selection */}
      <div className="space-y-4">
        <h4 className="font-medium">Choose Payment Method</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Local Ethiopian Payments */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData.paymentMethod === 'local' 
                ? 'border-primary bg-primary/5' 
                : 'border-muted hover:border-primary/50'
            }`}
            onClick={() => handleInputChange('paymentMethod', 'local')}
          >
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="radio" 
                checked={formData.paymentMethod === 'local'} 
                onChange={() => handleInputChange('paymentMethod', 'local')}
                className="text-primary"
              />
              <h5 className="font-semibold">🇪🇹 Local Payment (ETB)</h5>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Available methods:</p>
              <ul className="space-y-1">
                <li>• Telebirr Mobile Payment</li>
                <li>• CBE Birr</li>
                <li>• Bank Transfer</li>
                <li>• Mobile Banking</li>
              </ul>
              <p className="mt-2 font-medium text-primary">
                Price: {plan.originalPrice || plan.price} ETB/month
              </p>
              {formData.paymentMethod === 'local' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Best for Ethiopian customers
                </p>
              )}
            </div>
          </div>

          {/* International Card Payments */}
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              formData.paymentMethod === 'international' 
                ? 'border-primary bg-primary/5' 
                : 'border-muted hover:border-primary/50'
            }`}
            onClick={() => handleInputChange('paymentMethod', 'international')}
          >
            <div className="flex items-center gap-3 mb-2">
              <input 
                type="radio" 
                checked={formData.paymentMethod === 'international'} 
                onChange={() => handleInputChange('paymentMethod', 'international')}
                className="text-primary"
              />
              <h5 className="font-semibold">🌍 International Payment</h5>
            </div>
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Available methods:</p>
              <ul className="space-y-1">
                <li>• Visa Cards</li>
                <li>• Mastercard</li>
                <li>• International Bank Transfer</li>
                <li>• Online Banking</li>
              </ul>
              <p className="mt-2 font-medium text-primary">
                Price: {plan.price} {plan.currency}/month
              </p>
              {formData.paymentMethod === 'international' && (
                <p className="text-xs text-muted-foreground mt-1">
                  Best for international customers
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Alert>
        <Smartphone className="h-4 w-4" />
        <AlertDescription>
          {formData.paymentMethod === 'local' 
            ? "You'll be redirected to Chapa's secure payment page for Ethiopian payment methods (Telebirr, CBE Birr, Bank Transfer)."
            : "You'll be redirected to secure international payment gateway for card payments (Visa, Mastercard)."
          }
        </AlertDescription>
      </Alert>

      {/* Support Contact Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h5 className="font-medium text-blue-900 mb-2">Need Help?</h5>
        <p className="text-sm text-blue-800 mb-2">
          If you encounter any payment issues, our support team is ready to assist you:
        </p>
        <div className="text-sm text-blue-700">
          <p>📧 Email: support@vividplate.com</p>
          <p>📱 Telegram: @VividplateBot</p>
          <p>⏰ Available 24/7 for payment assistance</p>
        </div>
      </div>
      
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

        {/* International Payment Card Fields */}
        {formData.paymentMethod === 'international' && (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Card Information
            </h4>
            
            <div>
              <Label htmlFor="cardholderName">Cardholder Name *</Label>
              <Input
                id="cardholderName"
                type="text"
                value={formData.cardholderName || ''}
                onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                className={errors.cardholderName ? 'border-red-500' : ''}
                placeholder="Full name on card"
              />
              {errors.cardholderName && (
                <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number *</Label>
              <Input
                id="cardNumber"
                type="text"
                value={formData.cardNumber || ''}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                className={errors.cardNumber ? 'border-red-500' : ''}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              {errors.cardNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Visa, Mastercard, and other international cards accepted
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date *</Label>
                <Input
                  id="expiryDate"
                  type="text"
                  value={formData.expiryDate || ''}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  className={errors.expiryDate ? 'border-red-500' : ''}
                  placeholder="MM/YY"
                  maxLength={5}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  type="text"
                  value={formData.cvv || ''}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  className={errors.cvv ? 'border-red-500' : ''}
                  placeholder="123"
                  maxLength={4}
                />
                {errors.cvv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                🔒 Your card information is securely processed by Chapa's certified payment gateway
              </p>
            </div>
          </div>
        )}
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
            {plan.price > 0 ? `Pay ${formData.paymentMethod === 'local' 
              ? `${plan.originalPrice || plan.price} ETB`
              : `${plan.price} ${plan.currency}`}` : 'Continue with Free Plan'}
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
      
      // Determine currency based on payment method
      const paymentCurrency = formData.paymentMethod === 'local' ? 'ETB' : planData.currency;

      // Prepare payment data
      const paymentData: any = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        currency: paymentCurrency,
        countryCode: userCountry,
        paymentMethod: formData.paymentMethod
      };

      // Add card details for international payments
      if (formData.paymentMethod === 'international') {
        paymentData.cardNumber = formData.cardNumber;
        paymentData.expiryDate = formData.expiryDate;
        paymentData.cvv = formData.cvv;
        paymentData.cardholderName = formData.cardholderName;
      }

      // Call backend to initialize Chapa payment
      const response = await apiRequest('POST', `/api/chapa/initialize-payment/${planId}`, paymentData);

      console.log('Chapa initialization response:', response);
      const responseData = await response.json();
      console.log('Chapa initialization parsed:', responseData);

      if (responseData.status === 'success') {
        if (responseData.data.checkout_url) {
          toast({
            title: "Redirecting to Payment",
            description: formData.paymentMethod === 'local' 
              ? "Redirecting to Ethiopian payment methods (Telebirr, CBE Birr, etc.)"
              : "Redirecting to international payment gateway",
          });

          // Redirect to Chapa checkout page
          window.location.href = responseData.data.checkout_url;
        } else if (responseData.data.redirect_url) {
          // For free plans or direct redirects
          toast({
            title: "Success!",
            description: responseData.message || "Plan activated successfully",
          });
          window.location.href = responseData.data.redirect_url;
        }
      } else {
        throw new Error(responseData.message || 'Failed to initialize payment');
      }

    } catch (err: any) {
      console.error("Error initializing payment:", err);
      
      // Handle specific error cases
      if (err.message.includes('temporarily unavailable') || err.message.includes('not configured') || err.message.includes('503')) {
        toast({
          title: "Payment Service Unavailable",
          description: `Payment processing is currently being configured. Please contact support for assistance with ${formData.paymentMethod === 'local' ? 'Ethiopian payment methods (Telebirr, CBE Birr, Bank Transfer)' : 'international card payments (Visa, Mastercard)'}.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Payment Initialization Failed",
          description: err.message || "There was an error setting up your payment. Please try again.",
          variant: "destructive",
        });
      }
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
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
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
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="w-full mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
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
            onClick={() => navigate('/dashboard')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
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