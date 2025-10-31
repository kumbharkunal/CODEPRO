import api from './api';

const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/auth/github/callback`;

export const githubService = {
  // Start OAuth flow
  startOAuth: () => {
    const scope = 'repo admin:repo_hook';
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}`;
    window.location.href = githubAuthUrl;
  },

  // Exchange code for token
  exchangeCode: async (code: string) => {
    const response = await api.post('/github/callback', { code });
    return response.data;
  },

  // Get user's GitHub repositories
  getUserRepos: async (accessToken: string) => {
    const response = await api.post('/github/repos', { accessToken });
    return response.data;
  },

  // Connect repository
  connectRepository: async (repoData: any, accessToken: string, userId: string) => {
    const response = await api.post('/github/connect', {
      ...repoData,
      accessToken,
      userId,
    });
    return response.data;
  },

  // Disconnect repository
  disconnectRepository: async (repoId: string) => {
    const response = await api.delete(`/github/disconnect/${repoId}`);
    return response.data;
  },
};