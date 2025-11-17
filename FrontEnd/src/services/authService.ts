import api from './api';

export interface SyncClerkUserData {
  clerkId: string;
  email: string;
  name: string;
  profileImage?: string;
}

export const authService = {
  syncClerkUser: async (data: SyncClerkUserData, token?: string) => {
    const config = token ? {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    } : {};
    
    const response = await api.post('/clerk/sync', data, config);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};
