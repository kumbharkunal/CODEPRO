import { useEffect, useRef, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout, setLoading } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

export const useClerkAuth = () => {
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const isSyncing = useRef(false);
  const syncAttempted = useRef(false);

  useEffect(() => {
    const syncAuthState = async () => {
      if (!isLoaded) {
        dispatch(setLoading(true));
        return;
      }

      if (isSyncing.current) return;

      try {
        if (user && !isAuthenticated && !syncAttempted.current) {
          isSyncing.current = true;
          syncAttempted.current = true;
          
          const token = await getToken({ skipCache: true });
          if (!token) {
            dispatch(logout());
            isSyncing.current = false;
            return;
          }

          try {
            const response = await authService.syncClerkUser({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              name: user.fullName || user.username || 'User',
              profileImage: user.imageUrl,
            }, token);

            dispatch(setCredentials({
              user: response.user,
              token: token,
            }));
          } catch (syncError) {
            dispatch(setCredentials({
              user: {
                id: user.id,
                email: user.primaryEmailAddress?.emailAddress || '',
                name: user.fullName || user.username || 'User',
                role: 'viewer' as const,
                profileImage: user.imageUrl,
              },
              token: token,
            }));
          }
          
          isSyncing.current = false;
        } else if (!user && isLoaded) {
          const storedToken = localStorage.getItem('token');
          if (isAuthenticated || storedToken) {
            dispatch(logout());
            syncAttempted.current = false;
          }
        } else if (user && isAuthenticated) {
          syncAttempted.current = true;
        }
      } catch (error) {
        isSyncing.current = false;
        syncAttempted.current = false;
      } finally {
        dispatch(setLoading(false));
      }
    };

    syncAuthState();
  }, [user, isLoaded, isAuthenticated, dispatch]);

  const handleLogout = useCallback(async () => {
    try {
      syncAttempted.current = false;
      dispatch(logout());
      await signOut();
    } catch (error) {
      dispatch(logout());
    }
  }, [dispatch, signOut]);

  return {
    user,
    isLoaded,
    logout: handleLogout,
  };
};
