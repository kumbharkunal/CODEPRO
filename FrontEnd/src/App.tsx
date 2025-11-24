import { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { store } from './store/store';
import { useTheme } from './hooks/useTheme';
import { useClerkAuth } from './hooks/useClerkAuth';
import { SocketProvider } from './contexts/SocketContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import ScrollToTop from './components/ScrollToTop';
import PricingPage from './pages/PricingPage';
import { UniversalLoader } from './components/ui/UniversalLoader';

import Layout from './components/layout/Layout';
import DefaultLayout from './components/layout/DefaultLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ReviewsPage from './pages/ReviewsPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import RepositoriesPage from './pages/RepositoriesPage';
import GitHubCallbackPage from './pages/GithubCallbackPage';
import ConnectRepositoryPage from './pages/ConnectRepositoryPage';
import SettingsPage from './pages/SettingsPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import AdminUsersPage from './pages/AdminUsersPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminOnly from './components/auth/AdminOnly';
import TeamManagementPage from './pages/TeamManagementPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';

function AppContentInner() {
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasShownOAuthToast = useRef(false);

  console.log('🚀 [App.tsx] AppContentInner rendered, isSignedIn:', isSignedIn);

  // Handle OAuth callback toast - simpler approach using immediate detection
  useEffect(() => {
    const oauthAttempt = searchParams.get('oauth_attempt');

    console.log('🔄 [App.tsx] Checking OAuth callback:', {
      oauthAttempt,
      hasShownToast: hasShownOAuthToast.current,
      isSignedIn,
      authLoaded
    });

    // If we have an oauth_attempt parameter and haven't shown the toast yet
    if (oauthAttempt && !hasShownOAuthToast.current && authLoaded) {
      hasShownOAuthToast.current = true;

      console.log('✅ [App.tsx] Showing OAuth toast for:', oauthAttempt);

      // Show appropriate toast based on OAuth attempt type
      if (oauthAttempt === 'signup') {
        toast.success('Welcome back! You already have an account. Signed you in automatically.', {
          duration: 5000,
          icon: '👋',
        });
      } else if (oauthAttempt === 'signin') {
        toast.success('Successfully signed in!', {
          duration: 3000,
          icon: '✅',
        });
      }

      // Clean up URL parameter after a short delay to ensure it's visible
      setTimeout(() => {
        const currentParams = new URLSearchParams(window.location.search);
        currentParams.delete('oauth_attempt');
        const newUrl = `${window.location.pathname}${currentParams.toString() ? '?' + currentParams.toString() : ''}`;
        window.history.replaceState({}, '', newUrl);
      }, 100);
    }
  }, [searchParams, authLoaded, isSignedIn]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPageWrapper />} />
      <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />

      <Route element={<DefaultLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/reviews" element={<ProtectedRoute><ReviewsPage /></ProtectedRoute>} />
          <Route path="/reviews/:id" element={<ProtectedRoute><ReviewDetailPage /></ProtectedRoute>} />
          <Route path="/repositories" element={<ProtectedRoute><RepositoriesPage /></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute><AdminOnly><TeamManagementPage /></AdminOnly></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminOnly><AdminUsersPage /></AdminOnly></ProtectedRoute>} />
          <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
          <Route path="/repositories/connect" element={<ProtectedRoute><ConnectRepositoryPage /></ProtectedRoute>} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

function LoginPageWrapper() {
  const { isSignedIn } = useAuth();
  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

function AppContent() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }));

  const { theme } = useTheme();
  const { isLoaded } = useAuth();
  useClerkAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!isLoaded) {
    return <UniversalLoader />;
  }

  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <SocketProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3000,
                style: {
                  background: theme === 'dark' ? '#1f2937' : '#ffffff',
                  color: theme === 'dark' ? '#f9fafb' : '#111827',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#ffffff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#ffffff',
                  },
                },
              }}
            />
            <AppContentInner />
          </div>
        </SocketProvider>
      </QueryClientProvider>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </ErrorBoundary>
  );
}

export default App;
