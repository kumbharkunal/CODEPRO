import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export default function SSOCallbackPage() {
  const navigate = useNavigate();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isLoaded: userLoaded } = useUser();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (!authLoaded || !userLoaded) return;

    if (isSignedIn) {
      navigate('/dashboard', { replace: true });
      return;
    }

    const timeout = setTimeout(() => {
      if (!isSignedIn) {
        setTimeoutReached(true);
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 2000);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [authLoaded, userLoaded, isSignedIn, navigate]);

  if (timeoutReached) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center max-w-md px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-lg text-red-600 mb-2">Authentication is taking longer than expected.</p>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-indigo-600" />
        <p className="text-lg text-gray-900 mb-2">Completing sign in...</p>
        <p className="text-sm text-gray-600">Please wait while we verify your account</p>
      </div>
    </div>
  );
}
