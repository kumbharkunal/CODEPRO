import api from './api';

export interface SyncClerkUserData {
  clerkId: string;
  email: string;
  name: string;
  profileImage?: string;
}

export const authService = {
  // Sync Clerk user with backend
  syncClerkUser: async (data: SyncClerkUserData) => {
    const response = await api.post('/clerk/sync', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};