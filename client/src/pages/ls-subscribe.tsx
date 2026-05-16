import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import {
  Check,
  Zap,
  Star,
  ArrowLeft,
  Loader2,
  Shield,
  CreditCard,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Helmet } from 'react-helmet-async';

type BillingPeriod = 'monthly' | 'yearly';

const PLANS = {
  monthly: {
    key: 'monthly' as const,
    name: 'Monthly',
    price: 25,
    period: '/month',
    description: 'Full access, billed monthly',
    badge: null,
    savingsBadge: null,
    features: [
      '1 Restaurant Profile',
      'Unlimited Menu Items',
      'Unlimited Image Uploads',
      'QR Code Generation',
      'Custom Themes & Branding',
      'Analytics Dashboard',
      'Priority Support',
      'Ad-Free Experience',
    ],
  },
  yearly: {
    key: 'yearly' as const,
    name: 'Yearly',
    price: 250,
    period: '/year',
    description: 'Full access, billed yearly',
    badge: 'Best Value',
    savingsBadge: 'Save $50',
    features: [
      '1 Restaurant Profile',
      'Unlimited Menu Items',
      'Unlimited Image Uploads',
      'QR Code Generation',
      'Custom Themes & Branding',
      'Advanced Analytics',
      'Priority 24/7 Support',
      'Ad-Free Experience',
      'Early Access to New Features',
    ],
  },
};

export default function LsSubscribe() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  // Agents use tokens, not subscriptions — redirect them away
  const isAgent = (user as any)?.role === 'agent';
  if (isAgent) {
    toast({
      title: 'Agents use tokens, not subscriptions',
      description: 'Go to your Agent Dashboard to manage tokens and create restaurants for owners.',
    });
    navigate('/agent-dashboard');
    return null;
  }

  const handleSubscribe = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/ls/create-checkout', {
        plan: selectedPlan,
      });
      const data = await response.json();

      if (data.status === 'success' && data.checkoutUrl) {
        // Redirect to LemonSqueezy hosted checkout
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error(data.message || 'Failed to create checkout session');
      }
    } catch (err: any) {
      toast({
        title: 'Checkout failed',
        description: err.message || 'Please try again or contact support.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const plan = PLANS[selectedPlan];
  const otherPlan = PLANS[selectedPlan === 'monthly' ? 'yearly' : 'monthly'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <Helmet>
        <title>Subscribe — VividPlate Premium</title>
        <meta name="description" content="Upgrade to VividPlate Premium. $25/month or $250/year. Unlimited menu items, custom themes, analytics, and priority support." />
        <meta name="robots" content="noindex" />
      </Helmet>
      {/* Header */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
              <Zap className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-300 font-medium">VividPlate Premium</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-orange-300 bg-clip-text text-transparent">
              Elevate Your Restaurant
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              One subscription, every feature. No hidden fees. Cancel anytime.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-slate-800/60 backdrop-blur rounded-xl p-1 border border-slate-700/50">
              {(['monthly', 'yearly'] as BillingPeriod[]).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPlan(period)}
                  className={`relative px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedPlan === period
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {period === 'yearly' && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      SAVE $50
                    </span>
                  )}
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
            {Object.values(PLANS).map((p) => {
              const isSelected = p.key === selectedPlan;
              return (
                <div
                  key={p.key}
                  onClick={() => setSelectedPlan(p.key)}
                  className={`relative rounded-2xl border p-6 cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'border-orange-500/60 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-transparent shadow-xl shadow-orange-500/10'
                      : 'border-slate-700/50 bg-slate-800/30 hover:border-slate-600'
                  }`}
                >
                  {p.badge && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 shadow-lg">
                        <Star className="h-3 w-3 mr-1" />
                        {p.badge}
                      </Badge>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{p.name}</h3>
                      <p className="text-slate-400 text-sm mt-0.5">{p.description}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-extrabold text-white">${p.price}</span>
                    <span className="text-slate-400 text-sm">{p.period}</span>
                    {p.savingsBadge && (
                      <span className="ml-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-medium">
                        {p.savingsBadge}
                      </span>
                    )}
                  </div>

                  <ul className="space-y-2.5">
                    {p.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-sm">
                        <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="h-2.5 w-2.5 text-orange-400" strokeWidth={3} />
                        </div>
                        <span className="text-slate-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="max-w-md mx-auto text-center">
            <Button
              onClick={handleSubscribe}
              disabled={isLoading}
              size="lg"
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base py-6 rounded-xl shadow-lg shadow-orange-500/30 border-0 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating checkout…
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Subscribe {plan.name} · ${plan.price}{plan.period}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="mt-3 text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Secured by LemonSqueezy · 256-bit SSL
            </p>

            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="h-3.5 w-3.5" />
                All major cards
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" />
                Secure checkout
              </span>
            </div>
          </div>

          {/* FAQ strip */}
          <div className="mt-16 max-w-2xl mx-auto border-t border-slate-800 pt-10 pb-6">
            <h2 className="text-center text-slate-300 font-semibold mb-6 text-lg">Frequently Asked</h2>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                {
                  q: 'Can I cancel anytime?',
                  a: 'Yes. Cancel from your dashboard and you keep access until the end of the billing period.',
                },
                {
                  q: 'What payment methods are accepted?',
                  a: 'Visa, Mastercard, American Express, PayPal, and more via LemonSqueezy.',
                },
                {
                  q: 'Is there a free trial?',
                  a: 'The free plan is available indefinitely. Upgrade when you need more features.',
                },
                {
                  q: 'How do I access invoices?',
                  a: 'LemonSqueezy sends automatic receipts to your email after each payment.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                  <p className="font-medium text-white mb-1">{q}</p>
                  <p className="text-slate-400">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
