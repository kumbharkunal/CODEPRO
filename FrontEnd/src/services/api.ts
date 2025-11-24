import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRedirecting = false;
let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshQueue.push(cb);
}

function onRefreshed(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

api.interceptors.request.use(
  (config) => {
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isUnauthorized = error.response?.status === 401;
    const isForbidden = error.response?.status === 403;
    const isRateLimited = error.response?.status === 429;
    const notRetriedYet = !originalRequest?._retry;
    const isSyncEndpoint = originalRequest?.url?.includes('/clerk/sync');

    // Don't retry sync endpoint failures
    if (isSyncEndpoint) {
      return Promise.reject(error);
    }

    // Handle rate limiting with exponential backoff
    if (isRateLimited && !originalRequest?._rateLimitRetry) {
      console.warn('[API] Rate limited, retrying after delay...');
      (originalRequest as any)._rateLimitRetry = true;
      const delay = 2000; // 2 second delay for rate limits
      await new Promise(resolve => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    // Don't retry forbidden errors (permission issues)
    if (isForbidden) {
      console.error('[API] Forbidden:', error.response?.data?.message);
      return Promise.reject(error);
    }

    if (isUnauthorized && notRetriedYet) {
      if (originalRequest) {
        (originalRequest as any)._retry = true;
      }

      const tryRefreshToken = async (): Promise<string | null> => {
        try {
          refreshAttempts++;
          if (refreshAttempts > MAX_REFRESH_ATTEMPTS) {
            console.error('[API] Max refresh attempts reached');
            refreshAttempts = 0;
            return null;
          }
          
          const clerk: any = (window as any).Clerk;
          if (!clerk?.session) {
            console.warn('[API] No Clerk session available');
            return null;
          }
          
          const newToken: string | null = await clerk.session.getToken({ skipCache: true });
          if (newToken) {
            localStorage.setItem('token', newToken);
            refreshAttempts = 0; // Reset on success
          }
          return newToken;
        } catch (err) {
          console.error('[API] Token refresh failed:', err);
          return null;
        }
      };

      if (!isRefreshing) {
        isRefreshing = true;
        const newToken = await tryRefreshToken();
        isRefreshing = false;
        onRefreshed(newToken);

        if (newToken && originalRequest) {
          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${newToken}`,
          };
          return api(originalRequest);
        }
      } else {
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
