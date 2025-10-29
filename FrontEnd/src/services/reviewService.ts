import api from './api';

export const reviewService = {
  // Get all reviews
  getAllReviews: async () => {
    const response = await api.get('/reviews');
    return response.data;
  },

  // Get review by ID
  getReviewById: async (id: string) => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  // Get user's reviews
  getUserReviews: async (userId: string) => {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data;
  },

  // Get repository reviews
  getRepositoryReviews: async (repositoryId: string) => {
    const response = await api.get(`/reviews/repository/${repositoryId}`);
    return response.data;
  },

  // Get review statistics
  getReviewStats: async () => {
    const response = await api.get('/reviews/stats');
    return response.data;
  },
};