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
    const notRetriedYet = !originalRequest?._retry;
    const isSyncEndpoint = originalRequest?.url?.includes('/clerk/sync');

    if (isSyncEndpoint) {
      return Promise.reject(error);
    }

    if (isUnauthorized && notRetriedYet) {
      if (originalRequest) {
        (originalRequest as any)._retry = true;
      }

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
