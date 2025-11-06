import { useEffect, useRef } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout, setLoading } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

export const useClerkAuth = () => {
  const { user, isLoaded } = useUser(); 
  const { getToken, signOut } = useAuth();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  
  // Use ref to prevent multiple simultaneous syncs
  const isSyncing = useRef(false);

  useEffect(() => {
    const syncAuthState = async () => {
      if (!isLoaded) {
        dispatch(setLoading(true));
        return;
      }

      // Prevent multiple simultaneous sync operations
      if (isSyncing.current) {
        return;
      }

      try {
        if (user) {
          // Only sync if not already authenticated
          if (!isAuthenticated) {
            isSyncing.current = true;
            
            // Get Clerk session token
            const token = await getToken({ skipCache: true });
            if (!token) {
              console.error('No token available from Clerk');
              dispatch(logout());
              return;
            }

            // Sync with backend - only on fresh login
            const response = await authService.syncClerkUser({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              name: user.fullName || user.username || 'User',
              profileImage: user.imageUrl,
            }, token);

            // Save to Redux - this also saves token to localStorage
            dispatch(setCredentials({
              user: response.user,
              token: token,
            }));
          }
        } else {
          // No Clerk user - clear auth state
          const storedToken = localStorage.getItem('token');
          if (isAuthenticated || storedToken) {
            dispatch(logout());
          }
        }
      } catch (error) {
        console.error('Error syncing Clerk user:', error);
        dispatch(logout());
      } finally {
        isSyncing.current = false;
        dispatch(setLoading(false));
      }
    };

    syncAuthState();
  }, [user, isLoaded, dispatch, getToken, isAuthenticated]);

  const handleLogout = async () => {
    try {
      // Clear Redux state first
      dispatch(logout());
      // Sign out from Clerk
      await signOut();
    } catch (error) {
      console.error('Error during logout:', error);
      // Even if Clerk signOut fails, ensure local state is cleared
      dispatch(logout());
    }
  };

  return {
    user,
    isLoaded,
    logout: handleLogout,
  };
};