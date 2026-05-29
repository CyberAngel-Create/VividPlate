import { useLocation } from 'wouter';
import { Check, Zap, Star, ArrowRight, Shield, RefreshCw, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Helmet } from 'react-helmet-async';

const FEATURES = [
  'Restaurant Profile',
  'Unlimited Menu Items',
  'Unlimited Image Uploads',
  'QR Code Generation',
  'Custom Themes & Branding',
  'Analytics Dashboard',
  'Priority Support',
  'Ad-Free Experience',
];

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel your subscription at any time. You will retain access until the end of your current billing period.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and other methods depending on your region.',
  },
  {
    q: 'Is there a free plan?',
    a: 'Yes! The free plan lets you explore the platform with limited features. Upgrade when you\'re ready.',
  },
  {
    q: 'What is your refund policy?',
    a: 'We offer a 7-day refund window for new subscribers. See our full refund policy for details.',
  },
  {
    q: 'Do you offer discounts?',
    a: 'Yes — the yearly plan saves you $50 compared to paying monthly. That\'s over 2 months free.',
  },
  {
    q: 'Can I switch between plans?',
    a: 'Yes. You can upgrade or downgrade your plan at any time from your account dashboard.',
  },
];

export default function PricingPage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isAgent = (user as any)?.role === 'agent';

  // Agents use a token system — show them a different view
  if (isAgent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-500/20 border border-blue-500/30 mb-6">
            <span className="text-4xl">🏦</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Agents Use Tokens</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">
            As an agent, you don't pay a subscription. Instead, you request tokens from the admin
            and use them to create premium restaurants for your clients.
          </p>
          <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50 text-left mb-6 space-y-3">
            <p className="text-slate-300 text-sm flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✅</span>
              <span>Request tokens from Admin via your Agent Dashboard</span>
            </p>
            <p className="text-slate-300 text-sm flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✅</span>
              <span>Use tokens to create premium restaurants for restaurant owners</span>
            </p>
            <p className="text-slate-300 text-sm flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✅</span>
              <span>Owners get their restaurant activated — no payment needed from them</span>
            </p>
          </div>
          <button
            onClick={() => navigate('/agent-dashboard')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-3 rounded-xl"
          >
            Go to Agent Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleSubscribe = (plan: 'monthly' | 'yearly') => {
    if (user) {
      navigate(`/ls-subscribe?plan=${plan}`);
    } else {
      navigate(`/register?redirect=/ls-subscribe?plan=${plan}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <Helmet>
        <title>Pricing — VividPlate Premium</title>
        <meta name="description" content="Simple, transparent pricing for VividPlate. $25/month or $250/year. All features included. No hidden fees. Cancel anytime." />
        <meta property="og:title" content="VividPlate Pricing — One Plan, Every Feature" />
        <meta property="og:description" content="Give your restaurant a stunning digital menu. $25/month or $250/year. No hidden fees." />
        <link rel="canonical" href="https://www.vividplate.com/pricing" />
      </Helmet>
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-orange-500/15 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
            <Zap className="h-4 w-4 text-orange-400" />
            <span className="text-sm text-orange-300 font-medium">Simple, transparent pricing</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-white via-purple-200 to-orange-300 bg-clip-text text-transparent leading-tight">
            One Plan.<br />Every Feature.
          </h1>
          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-4">
            Give your restaurant a stunning digital menu. No hidden fees. Cancel anytime.
          </p>
          <p className="text-slate-500 text-sm">
            Used by restaurants worldwide · Powered by VividPlate
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Monthly */}
          <div className="relative rounded-2xl border border-slate-700/50 bg-slate-800/40 p-8 hover:border-slate-600 transition-all duration-300">
            <h2 className="text-xl font-bold text-white mb-1">Monthly</h2>
            <p className="text-slate-400 text-sm mb-6">Full access, billed every month</p>

            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-5xl font-extrabold text-white">$25</span>
              <span className="text-slate-400">/month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-orange-400" strokeWidth={3} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSubscribe('monthly')}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-5 rounded-xl border border-slate-600 transition-all"
            >
              Get Started Monthly
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Yearly — highlighted */}
          <div className="relative rounded-2xl border border-orange-500/50 bg-gradient-to-br from-orange-500/10 via-purple-500/5 to-transparent p-8 shadow-xl shadow-orange-500/10">
            {/* Best value badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0 px-4 py-1 text-sm shadow-lg">
                <Star className="h-3.5 w-3.5 mr-1.5" />
                Best Value — Save $50
              </Badge>
            </div>

            <h2 className="text-xl font-bold text-white mb-1">Yearly</h2>
            <p className="text-slate-400 text-sm mb-6">Full access, billed once a year</p>

            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-5xl font-extrabold text-white">$250</span>
              <span className="text-slate-400">/year</span>
            </div>
            <p className="text-green-400 text-sm font-medium mb-8">
              That's just $20.83/month — save $50 vs monthly
            </p>

            <ul className="space-y-3 mb-8">
              {[...FEATURES, 'Early Access to New Features'].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-orange-400" strokeWidth={3} />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleSubscribe('yearly')}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-5 rounded-xl border-0 shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5"
            >
              Get Started Yearly
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500 mb-20 border-t border-slate-800 pt-10">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            Secure SSL checkout
          </span>
          <span className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-slate-400" />
            Cancel anytime
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4 text-slate-400" />
            7-day refund guarantee
          </span>
          <span className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-slate-400" />
            Instant activation
          </span>
        </div>

        {/* Free plan notice */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 text-center mb-20">
          <h3 className="text-white font-semibold text-lg mb-2">Just want to try it out?</h3>
          <p className="text-slate-400 mb-4">
            The free plan is available forever — no credit card required. Explore the platform at your own pace.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/register')}
            className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-400"
          >
            Start for Free
          </Button>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-2xl font-bold text-white text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6 text-orange-400" />
            Frequently Asked Questions
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {FAQ.map(({ q, a }) => (
              <div key={q} className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/40">
                <p className="font-semibold text-white mb-2">{q}</p>
                <p className="text-slate-400 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap justify-center gap-6 mt-12 text-xs text-slate-600">
          <a href="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          <a href="/privacy-policy" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="/refund-policy" className="hover:text-slate-400 transition-colors">Refund Policy</a>
          <a href="/contact" className="hover:text-slate-400 transition-colors">Contact Us</a>
        </div>
      </div>
    </div>
  );
}