import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in environment variables');
}

// Validate key format
if (!PUBLISHABLE_KEY.startsWith('pk_test_') && !PUBLISHABLE_KEY.startsWith('pk_live_')) {
  console.error('Invalid Clerk Publishable Key format. Expected format: pk_test_... or pk_live_...');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider
    publishableKey={PUBLISHABLE_KEY}
    // Primary redirect URLs (highest priority)
    signInFallbackRedirectUrl="/dashboard"
    signUpFallbackRedirectUrl="/dashboard"
    // Force redirect URLs (ensures redirect happens even if other conditions fail)
    signInForceRedirectUrl="/dashboard"
    signUpForceRedirectUrl="/dashboard"
    // After sign-in/sign-up URLs (for Clerk UI components)
    afterSignInUrl="/dashboard"
    afterSignUpUrl="/dashboard"
    // Add appearance customization for better UX
    appearance={{
      variables: {
        colorPrimary: '#4F46E5', // Indigo-600
      },
    }}
  >
    <App />
  </ClerkProvider>
);
