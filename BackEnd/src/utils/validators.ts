import { z } from 'zod';

export const createUserSchema = z.object({
    clerkId: z.string().min(1, 'Clerk ID is required'),
    email: z.string().email('Invalid email address'),
    name: z.string().min(2, "Name must be atleast 2 characters"),
    profileImage: z.string().url().optional(),
    role: z.enum(['admin', 'developer', 'viewer']).optional(),
});