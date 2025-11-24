import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { authService } from '../services/authService';
import { useAppDispatch } from '../store/hooks';
import { setCredentials } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

export const useUpdateUser = () => {
    return useMutation({
        mutationFn: async ({ userId, data }: { userId: string; data: { name?: string; email?: string } }) => {
            const response = await api.put(`/users/${userId}`, data);
            return response.data;
        },
    });
};

export const useUploadProfileImage = () => {
    return useMutation({
        mutationFn: async ({ userId, file }: { userId: string; file: File }) => {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', userId);
            const response = await api.post('/upload/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return response.data;
        },
    });
};

export const useSyncClerkUser = () => {
    const dispatch = useAppDispatch();

    return useMutation({
        mutationFn: async ({ clerkUser, token }: { clerkUser: any, token: string }) => {
            return authService.syncClerkUser({
                clerkId: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                name: clerkUser.fullName || clerkUser.username || 'User',
                profileImage: clerkUser.imageUrl,
            }, token);
        },
        onSuccess: (data, variables) => {
            dispatch(setCredentials({
                user: data.user,
                token: variables.token,
            }));
            toast.success('Subscription status updated!');
        },
        onError: (error) => {
            console.error('Error refreshing subscription:', error);
            toast.error('Failed to refresh subscription status');
        }
    });
};
