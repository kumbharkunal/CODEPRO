import api from './api';
import { Team, User } from '../types';

export const teamService = {
  // Get current user's team
  getMyTeam: async (): Promise<Team> => {
    const response = await api.get('/team');
    return response.data;
  },

  // Update team name (admin only)
  updateTeam: async (name: string): Promise<{ message: string; team: Team }> => {
    const response = await api.patch('/team', { name });
    return response.data;
  },

  // Get team members
  getTeamMembers: async (): Promise<User[]> => {
    const response = await api.get('/team/members');
    return response.data;
  },

  // Remove member from team (admin only)
  removeMember: async (memberId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/team/members/${memberId}`);
    return response.data;
  },
};
