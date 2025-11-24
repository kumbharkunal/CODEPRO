import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, ChevronDown } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { stripeService } from '@/services/stripeService';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { SUBSCRIPTION_LIMITS, PLANS } from '@/config/constants';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out CodePro',
    priceId: import.meta.env.VITE_STRIPE_PRICE_FREE || '',
    icon: <Sparkles className="w-5 h-5" />,
    gradient: 'from-gray-500 to-gray-600',
    features: [
      `${SUBSCRIPTION_LIMITS[PLANS.FREE].maxReviewsPerMonth} AI reviews per month`,
      'AI-powered code analysis',
      `${SUBSCRIPTION_LIMITS[PLANS.FREE].maxRepositories} connected repository`,
      'Community support',
      'Email support',
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
    icon: <Zap className="w-5 h-5" />,
    gradient: 'from-primary to-blue-600',
    features: [
      `${SUBSCRIPTION_LIMITS[PLANS.PRO].maxReviewsPerMonth} AI reviews per month`,
      'Advanced AI analysis',
      `Up to ${SUBSCRIPTION_LIMITS[PLANS.PRO].maxRepositories} connected repositories`,
      'Priority support',
      'Private repositories',
      'Team collaboration',
      'Detailed analytics',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: '$99',
    period: '/month',
    description: 'For teams and organizations',
    priceId: import.meta.env.VITE_STRIPE_PRICE_ENTERPRISE || '',
    icon: <Crown className="w-5 h-5" />,
    gradient: 'from-purple-600 to-pink-600',
    features: [
      'Unlimited AI reviews',
      'Everything in Pro',
      'Unlimited repositories',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee',
      'Advanced security',
      'Team management',
      'Custom AI training',
      'On-premise option',
      'SSO/SAML',
    ],
    cta: 'Upgrade to Enterprise',
    popular: false,
  },
];

const faqs = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes! You can cancel your subscription at any time. Your access will continue until the end of your billing period, and you won\'t be charged again.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Yes! Pro plan comes with a 14-day free trial. No credit card required to start. You can explore all Pro features risk-free.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, MasterCard, American Express, Discover) through Stripe, our secure payment processor.',
  },
  {
    question: 'Can I upgrade or downgrade my plan?',
    answer: 'Absolutely! You can change your plan at any time from your account settings. Changes take effect immediately, and billing is prorated.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with CodePro, contact us for a full refund within 30 days of purchase.',
  },
  {
    question: 'How does the AI code review work?',
    answer: 'Our AI uses Google\'s Gemini Pro 2.0 to analyze your code for bugs, security issues, and best practices. It runs automatically on every pull request.',
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  // Get user's current plan
  const currentPlan = user?.subscription?.plan || 'free';

  // Helper to determine button state
  const getButtonState = (planName: string) => {
    const planLower = planName.toLowerCase();
    const isCurrentPlan = currentPlan === planLower;
    const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
    const currentTier = planHierarchy[currentPlan as keyof typeof planHierarchy] || 0;
    const planTier = planHierarchy[planLower as keyof typeof planHierarchy] || 0;
    const isLowerTier = planTier < currentTier;

    return {
      isCurrentPlan,
      isLowerTier,
      isDisabled: isCurrentPlan || isLowerTier,
      buttonText: isCurrentPlan
        ? 'Your current Plan'
        : isLowerTier
          ? 'Not Available'
          : planName === 'Free'
            ? 'Get Started'
            : planName === 'Pro'
              ? 'Upgrade to Pro'
              : 'Upgrade to Enterprise'
    };
  };

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
      // Enterprise now triggers Stripe checkout
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
    <div className="min-h-screen py-20 lg:py-32 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Pricing Plans</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
            <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Simple, Transparent
            </span>
            <br />
            <span className="text-foreground">Pricing</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that's right for you. All plans include our core AI-powered code review features.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto mb-20">
          {plans.map((plan, index) => {
            const buttonState = getButtonState(plan.name);
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card
                  className={`relative h-full transition-all duration-300 hover:shadow-2xl ${plan.popular
                    ? 'border-primary shadow-xl scale-105 lg:scale-110'
                    : 'hover:border-primary/50'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="px-4 py-1.5 bg-gradient-to-r from-primary to-blue-600 border-0 shadow-lg">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="space-y-4 pb-8">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r ${plan.gradient} text-white`}>
                      {plan.icon}
                    </div>
                    <div>
                      <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                      <CardDescription className="text-base">{plan.description}</CardDescription>
                    </div>
                    <div className="pt-4">
                      <div className="flex items-baseline">
                        <span className="text-5xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground ml-2">{plan.period}</span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 pb-8">
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * i }}
                          className="flex items-start gap-3"
                        >
                          <div className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r ${plan.gradient} flex items-center justify-center mt-0.5`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-sm leading-relaxed">{feature}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className={`w-full py-6 text-base font-semibold rounded-xl transition-all duration-300 ${plan.popular && !buttonState.isDisabled
                        ? `bg-gradient-to-r ${plan.gradient} hover:opacity-90 shadow-lg hover:shadow-xl text-white`
                        : ''
                        }`}
                      variant={plan.popular && !buttonState.isDisabled ? 'default' : 'outline'}
                      onClick={() => handleSubscribe(plan)}
                      disabled={loading === plan.name || buttonState.isDisabled}
                    >
                      {loading === plan.name ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          {buttonState.isCurrentPlan && <Sparkles className="w-4 h-4 mr-2" />}
                          {buttonState.buttonText}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about CodePro
            </p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-primary/50"
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{faq.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${expandedFAQ === index ? 'rotate-180' : ''
                          }`}
                      />
                    </div>
                  </CardHeader>
                  {expandedFAQ === index && (
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 text-center"
        >
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 backdrop-blur-sm">
            <CardContent className="py-12 px-6">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Still have questions?
              </h3>
              <p className="text-muted-foreground mb-6 text-lg">
                Our team is here to help. Get in touch with us.
              </p>
              <Button
                size="lg"
                className="rounded-full px-8"
                onClick={() => window.location.href = 'mailto:support@codepro.dev'}
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}