import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { useAuth } from '@clerk/clerk-react';
import { store } from './store/store';
import { useTheme } from './hooks/useTheme';
import { useClerkAuth } from './hooks/useClerkAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import PricingPage from './pages/PricingPage';

// Layout
import Layout from './components/layout/Layout';
import DefaultLayout from './components/layout/DefaultLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Pages
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
import NotFoundPage from './pages/NotFoundPage';
import SSOCallbackPage from './pages/SSOCallbackPage';

function AppContentInner() {
  return (
    <Routes>
      {/* Routes without chrome */}
      <Route path="/login" element={<LoginPageWrapper />} />
      <Route path="/sso-callback" element={<SSOCallbackPage />} />
      <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />

      {/* Routes with chrome via DefaultLayout */}
      <Route element={<DefaultLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<PricingPage />} />

        {/* App section still uses existing Layout wrapper */}
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews"
            element={
              <ProtectedRoute>
                <ReviewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/:id"
            element={
              <ProtectedRoute>
                <ReviewDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/repositories"
            element={
              <ProtectedRoute>
                <RepositoriesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/auth/github/callback" element={<GitHubCallbackPage />} />
          <Route
            path="/repositories/connect"
            element={
              <ProtectedRoute>
                <ConnectRepositoryPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>

      {/* 404 - Must be last */}
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
  const { theme } = useTheme();
  const { isLoaded } = useAuth();
  useClerkAuth(); // Sync Clerk with our backend

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-900 dark:text-gray-100">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
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