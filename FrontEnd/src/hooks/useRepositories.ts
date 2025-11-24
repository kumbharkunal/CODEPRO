import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { repositoryService } from '../services/repositoryService';
import { githubService } from '../services/githubService';
import toast from 'react-hot-toast';
import { Repository } from '../types';

export const useRepositories = () => {
    return useQuery<Repository[]>({
        queryKey: ['repositories'],
        queryFn: repositoryService.getAllRepositories,
    });
};

export const useUserRepositories = (userId: string) => {
    return useQuery<Repository[]>({
        queryKey: ['repositories', 'user', userId],
        queryFn: () => repositoryService.getUserRepositories(userId),
        enabled: !!userId,
    });
};

export const useRepository = (id: string) => {
    return useQuery<Repository>({
        queryKey: ['repositories', id],
        queryFn: () => repositoryService.getRepositoryById(id),
        enabled: !!id,
    });
};

export const useCreateRepository = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: repositoryService.createRepository,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            toast.success('Repository connected successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to connect repository');
        },
    });
};

export const useConnectRepository = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ repoData, accessToken, userId }: { repoData: any, accessToken: string, userId: string }) =>
            githubService.connectRepository(repoData, accessToken, userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
        },
    });
};

export const useDeleteRepository = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: repositoryService.deleteRepository,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['repositories'] });
            toast.success('Repository disconnected successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to disconnect repository');
        },
    });
};
