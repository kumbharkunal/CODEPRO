import api from './api';

export interface User {
  _id: string;
  id: string;
  clerkId: string;
  email: string;
  name: string;
  role: 'admin' | 'developer' | 'viewer';
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
}

export const userService = {
  // Get all users (Admin only)
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user role (Admin only)
  updateUserRole: async (userId: string, role: 'admin' | 'developer' | 'viewer'): Promise<User> => {
    const response = await api.put(`/users/${userId}/role`, { role });
    return response.data.user;
  },

  // Delete user (Admin only)
  deleteUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },
};

