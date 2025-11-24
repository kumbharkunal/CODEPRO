export const PLANS = {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise'
};

export const SUBSCRIPTION_LIMITS = {
    [PLANS.FREE]: {
        maxRepositories: 1,
        maxReviewsPerMonth: 60,
        maxTeamMembers: 1
    },
    [PLANS.PRO]: {
        maxRepositories: 5,
        maxReviewsPerMonth: 300,
        maxTeamMembers: 5
    },
    [PLANS.ENTERPRISE]: {
        maxRepositories: 999999,
        maxReviewsPerMonth: 999999,
        maxTeamMembers: 999999
    }
};
