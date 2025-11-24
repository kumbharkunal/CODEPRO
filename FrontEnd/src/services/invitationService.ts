import api from './api';
import { Invitation } from '../types';

export interface CreateInvitationResponse {
  message: string;
  invitation: Invitation;
  invitationLink: string;
}

export interface AcceptInvitationResponse {
  message: string;
  team: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const invitationService = {
  // Create invitation (admin only)
  createInvitation: async (email: string): Promise<CreateInvitationResponse> => {
    const response = await api.post('/invitations', { email });
    return response.data;
  },

  // Get team invitations (admin only)
  getTeamInvitations: async (): Promise<Invitation[]> => {
    const response = await api.get('/invitations');
    return response.data;
  },

  // Get invitation by token (public - no auth needed)
  getInvitationByToken: async (token: string): Promise<Invitation> => {
    const response = await api.get(`/invitations/token/${token}`);
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (token: string): Promise<AcceptInvitationResponse> => {
    const response = await api.post(`/invitations/${token}/accept`, {});
    return response.data;
  },

  // Revoke invitation (admin only)
  revokeInvitation: async (invitationId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/invitations/${invitationId}`);
    return response.data;
  },
};
