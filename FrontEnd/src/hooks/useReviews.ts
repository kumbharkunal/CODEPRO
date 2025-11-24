import { useQuery } from '@tanstack/react-query';
import { reviewService } from '../services/reviewService';

export const useReviews = () => {
    return useQuery({
        queryKey: ['reviews'],
        queryFn: reviewService.getAllReviews,
    });
};

export const useReview = (id: string) => {
    return useQuery({
        queryKey: ['review', id],
        queryFn: () => reviewService.getReviewById(id),
        enabled: !!id,
    });
};

export const useReviewStats = () => {
    return useQuery({
        queryKey: ['reviewStats'],
        queryFn: reviewService.getReviewStats,
    });
};
