import api from './api';

export interface LoginData {
  email: string;
  clerkId: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'developer' | 'viewer';
  };
}

export const authService = {
  // Login
  login: async (data: LoginData): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout (client-side only, no API call needed)
  logout: () => {
    localStorage.removeItem('token');
  },
};