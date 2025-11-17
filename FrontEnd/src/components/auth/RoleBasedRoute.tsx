import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useAppSelector } from '@/store/hooks';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'developer' | 'viewer')[];
}

/**
 * RoleBasedRoute - Protects routes based on user role
 * Redirects to dashboard if user doesn't have required role
 */
export default function RoleBasedRoute({ 
  children, 
  allowedRoles = ['admin', 'developer', 'viewer'] 
}: RoleBasedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const user = useAppSelector(state => state.auth.user);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to dashboard if user doesn't have required role
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

