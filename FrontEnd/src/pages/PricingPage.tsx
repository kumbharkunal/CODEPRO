import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { stripeService } from '@/services/stripeService';
import toast from 'react-hot-toast';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out CodePro',
    priceId: import.meta.env.VITE_STRIPE_PRICE_FREE || '',
    features: [
      '5 reviews per month',
      'Basic AI analysis',
      '1 repository',
      'Community support',
      'Public repositories only',
    ],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For professional developers',
    priceId: import.meta.env.VITE_STRIPE_PRICE_PRO || '',
    features: [
      'Unlimited reviews',
      'Advanced AI analysis',
      'Unlimited repositories',
      'Priority support',
      'Private repositories',
      'Custom review rules',
      'Team collaboration',
    ],
    cta: 'Start Pro Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For teams and organizations',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || '',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'Team management',
      'Custom AI training',
      'On-premise option',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (!user) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    if (plan.name === 'Free') {
      navigate('/dashboard');
      return;
    }

    if (plan.name === 'Enterprise') {
      window.location.href = 'mailto:sales@codepro.dev?subject=Enterprise Inquiry';
      return;
    }

    setLoading(plan.name);

    try {
      const { url } = await stripeService.createCheckoutSession(
        user.id,
        plan.priceId,
        plan.name.toLowerCase()
      );

      window.location.href = url;
    } catch (error) {
      toast.error('Failed to start checkout');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose the plan that's right for you
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative ${
                plan.popular ? 'border-primary shadow-lg scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="px-4 py-1">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading === plan.name}
                >
                  {loading === plan.name ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <FAQItem
              question="Can I cancel anytime?"
              answer="Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period."
            />
            <FAQItem
              question="Is there a free trial?"
              answer="Yes! Pro plan comes with a 14-day free trial. No credit card required to start."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards (Visa, MasterCard, American Express) through Stripe."
            />
            <FAQItem
              question="Can I upgrade or downgrade my plan?"
              answer="Absolutely! You can change your plan at any time from your account settings."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b pb-4">
      <h3 className="font-semibold text-lg mb-2">{question}</h3>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
}