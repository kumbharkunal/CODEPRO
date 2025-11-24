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
  const lastSyncedClerkId = useRef<string | null>(null);
  const lastSyncAttemptTime = useRef<number>(0);
  const MIN_SYNC_INTERVAL = 10000; // 10 seconds minimum between sync attempts

  const forceSyncUser = useCallback(async () => {
    if (!user || isSyncing.current) return;

    isSyncing.current = true;
    try {
      const token = await getToken({ skipCache: true });
      if (!token) {
        dispatch(logout());
        return;
      }

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

      lastSyncedClerkId.current = user.id;
      lastSyncAttemptTime.current = Date.now();
    } catch (error) {
      console.error('Force sync failed:', error);
    } finally {
      isSyncing.current = false;
    }
  }, [user, getToken, dispatch]);

  useEffect(() => {
    const syncAuthState = async () => {
      if (!isLoaded) {
        dispatch(setLoading(true));
        return;
      }

      // Prevent sync if already syncing or recently synced
      if (isSyncing.current) return;

      const now = Date.now();
      const timeSinceLastSync = now - lastSyncAttemptTime.current;

      if (timeSinceLastSync < MIN_SYNC_INTERVAL && syncAttempted.current) {
        console.log(`[useClerkAuth] Skipping sync - last synced ${timeSinceLastSync}ms ago`);
        return;
      }

      try {
        // Only sync if user exists and either:
        // 1. Never attempted sync before
        // 2. Clerk user ID changed
        // 3. Not authenticated in Redux
        const shouldSync = user && (
          !syncAttempted.current ||
          lastSyncedClerkId.current !== user.id ||
          !isAuthenticated
        );

        if (shouldSync) {
          isSyncing.current = true;
          syncAttempted.current = true;
          lastSyncAttemptTime.current = now;

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

            lastSyncedClerkId.current = user.id;
          } catch (syncError: any) {
            console.error('Failed to sync user with backend:', syncError);

            // Categorize the error for better handling
            const errorStatus = syncError.response?.status;
            const errorMessage = syncError.response?.data?.message || syncError.message;

            // Detailed error logging
            console.error('Sync Error Details:', {
              status: errorStatus,
              message: errorMessage,
              clerkId: user.id,
              timestamp: new Date().toISOString(),
              attemptNumber: syncAttempted.current ? 'retry' : 'first',
            });

            // Handle different error types
            if (errorStatus === 401 || errorStatus === 403) {
              // Auth errors - reset and allow retry
              console.warn('Authentication error during sync. User may need to re-login.');
              syncAttempted.current = false;

              // If this persists, logout the user
              const shouldLogout = localStorage.getItem('auth_sync_failures');
              if (shouldLogout && parseInt(shouldLogout) > 3) {
                console.error('Multiple auth failures detected. Logging out user.');
                localStorage.removeItem('auth_sync_failures');
                dispatch(logout());
              } else {
                localStorage.setItem('auth_sync_failures', String((parseInt(shouldLogout || '0') + 1)));
              }
            } else if (errorStatus === 429) {
              // Rate limiting - don't retry immediately
              console.warn('Rate limited. Will retry on next sync interval.');
              syncAttempted.current = true; // Prevent immediate retry
            } else if (errorStatus >= 500) {
              // Server errors - retry with backoff
              console.warn('Server error during sync. Will retry later.');
              syncAttempted.current = true;
            } else if (errorMessage?.includes('network') || !errorStatus) {
              // Network errors
              console.warn('Network error during sync. Will retry when connection is restored.');
              syncAttempted.current = false; // Allow retry
            } else {
              // Unknown errors - don't block user but log for debugging
              console.error('Unknown sync error:', syncError);
              syncAttempted.current = true;
            }

            isSyncing.current = false;
            return;
          }

          isSyncing.current = false;
        } else if (!user && isLoaded) {
          // User logged out in Clerk
          const storedToken = localStorage.getItem('token');
          if (isAuthenticated || storedToken) {
            dispatch(logout());
            syncAttempted.current = false;
            lastSyncedClerkId.current = null;
          }
        }
      } catch (error) {
        console.error('Auth sync error:', error);
        isSyncing.current = false;
      } finally {
        dispatch(setLoading(false));
      }
    };

    syncAuthState();

    // CRITICAL: Only include user.id and isLoaded in dependencies
    // Don't include isAuthenticated, getToken, or dispatch as they can change frequently
  }, [user?.id, isLoaded]); // Simplified dependencies

  const handleLogout = useCallback(async () => {
    try {
      syncAttempted.current = false;
      lastSyncedClerkId.current = null;
      lastSyncAttemptTime.current = 0;
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
    forceSyncUser,
  };
};
