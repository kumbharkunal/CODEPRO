import api from './api';

export const repositoryService = {
  // Get all repositories
  getAllRepositories: async () => {
    const response = await api.get('/repositories');
    return response.data;
  },

  // Get repository by ID
  getRepositoryById: async (id: string) => {
    const response = await api.get(`/repositories/${id}`);
    return response.data;
  },

  // Get user's repositories
  getUserRepositories: async (userId: string) => {
    const response = await api.get(`/repositories/user/${userId}`);
    return response.data;
  },

  // Create repository
  createRepository: async (data: any) => {
    const response = await api.post('/repositories', data);
    return response.data;
  },

  // Delete repository
  deleteRepository: async (id: string) => {
    const response = await api.delete(`/repositories/${id}`);
    return response.data;
  },
};