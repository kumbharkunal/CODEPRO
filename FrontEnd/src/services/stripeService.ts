import api from './api';

export const stripeService = {
  // Create checkout session
  createCheckoutSession: async (userId: string, priceId: string, plan: string) => {
    const response = await api.post('/stripe/create-checkout', {
      userId,
      priceId,
      plan,
    });
    return response.data;
  },

  // Create customer portal
  createCustomerPortal: async (userId: string) => {
    const response = await api.post('/stripe/create-portal', {
      userId,
    });
    return response.data;
  },

  // Get subscription status
  getSubscriptionStatus: async (userId: string) => {
    const response = await api.get(`/stripe/subscription/${userId}`);
    return response.data;
  },
};