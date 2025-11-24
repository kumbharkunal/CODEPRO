import { z } from 'zod';

export const updateUserSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional(),
    profileImage: z.string().url().optional(),
});

export const updateRoleSchema = z.object({
    role: z.enum(['admin', 'developer', 'viewer']),
});

export const createReviewSchema = z.object({
    repositoryId: z.string().min(1),
    pullRequestNumber: z.number().int().positive(),
    pullRequestTitle: z.string().min(1),
    pullRequestUrl: z.string().url(),
    author: z.string().min(1),
    files: z.array(z.object({
        filename: z.string(),
        content: z.string(),
        patch: z.string().optional(),
    })).optional(),
});

export const createRepositorySchema = z.object({
    githubRepoId: z.number().int().positive(),
    name: z.string().min(1),
    fullName: z.string().min(1),
    owner: z.string().min(1),
    description: z.string().optional(),
    isPrivate: z.boolean(),
    defaultBranch: z.string().min(1),
    githubAccessToken: z.string().min(1),
});

export const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2).max(50).optional(),
    clerkId: z.string().min(1),
});