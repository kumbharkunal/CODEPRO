export const SUBSCRIPTION_LIMITS = {
    free: {
        maxRepositories: 1,
        maxReviewsPerMonth: 60,
    },
    pro: {
        maxRepositories: 5,
        maxReviewsPerMonth: 300,
    },
    enterprise: {
        maxRepositories: Infinity,
        maxReviewsPerMonth: Infinity,
    },
};

export const PLANS = {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
} as const;

export type PlanType = typeof PLANS[keyof typeof PLANS];
