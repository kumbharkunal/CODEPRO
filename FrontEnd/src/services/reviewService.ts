import api from './api';

// Helper function for retrying requests with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 500
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on 403 (forbidden) or 404 (not found)
      if (error.response?.status === 403 || error.response?.status === 404) {
        throw error;
      }
      
      // On last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

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

  // Get review statistics (with retry logic for initial load issues)
  getReviewStats: async () => {
    return retryWithBackoff(async () => {
      const response = await api.get('/reviews/stats', {
        timeout: 10000, // 10 second timeout
      });
      return response.data;
    }, 3, 500);
  },
};