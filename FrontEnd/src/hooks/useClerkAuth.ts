import { useEffect } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials, logout, setLoading } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

export const useClerkAuth = () => {
  const { user, isLoaded } = useUser();
  const { getToken, signOut } = useAuth();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const syncAuthState = async () => {
      if (!isLoaded) {
        dispatch(setLoading(true));
        return;
      }

      if (user) {
        try {
          // Get Clerk session token
          const token = await getToken({ skipCache: true });
          if (!token) {
            console.error('No token available');
            return;
          }

          // Sync with our backend
          const response = await authService.syncClerkUser({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            name: user.fullName || user.username || 'User',
            profileImage: user.imageUrl,
          });

          // Save to Redux
          dispatch(setCredentials({
            user: response.user,
            token: token || '',
          }));
        } catch (error) {
          console.error('Error syncing Clerk user:', error);
          dispatch(logout());
        }
      } else {
        dispatch(logout());
      }

      dispatch(setLoading(false));
    };

    syncAuthState();
  }, [user, isLoaded, dispatch, getToken]);

  const handleLogout = async () => {
    await signOut();
    dispatch(logout());
  };

  return {
    user,
    isLoaded,
    logout: handleLogout,
  };
};