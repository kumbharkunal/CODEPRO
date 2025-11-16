import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already redirecting to prevent multiple redirects
let isRedirecting = false;

// Request interceptor - Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Simple refresh control to avoid parallel refreshes
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshQueue.push(cb);
}

function onRefreshed(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

// Response interceptor - Handle errors globally with one-time retry on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 once per request
    const isUnauthorized = error.response?.status === 401;
    const notRetriedYet = !originalRequest?._retry;

    if (isUnauthorized && notRetriedYet) {
      // mark request as retried to avoid loops
      if (originalRequest) {
        (originalRequest as any)._retry = true;
      }

      // Try to refresh Clerk token if available
      const tryRefreshToken = async (): Promise<string | null> => {
        try {
          const clerk: any = (window as any).Clerk;
          if (!clerk?.session) return null;
          const newToken: string | null = await clerk.session.getToken({ skipCache: true });
          if (newToken) {
            localStorage.setItem('token', newToken);
          }
          return newToken;
        } catch {
          return null;
        }
      };

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefreshToken();
        isRefreshing = false;
        onRefreshed(newToken);

        if (newToken && originalRequest) {
          // Update header and retry
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${newToken}`,
          };
          return api(originalRequest);
        }
      } else {
        // Wait for ongoing refresh to complete
        const tokenFromRefresh = await new Promise<string | null>((resolve) => {
          subscribeTokenRefresh(resolve);
        });

        if (tokenFromRefresh && originalRequest) {
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${tokenFromRefresh}`,
          };
          return api(originalRequest);
        }
      }
    }

    // If still unauthorized (or no token refresh path), perform previous fallback redirect
    if (isUnauthorized && !isRedirecting) {
      isRedirecting = true;
      localStorage.removeItem('token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      setTimeout(() => {
        isRedirecting = false;
      }, 1000);
    }

    return Promise.reject(error);
  }
);

export default api;