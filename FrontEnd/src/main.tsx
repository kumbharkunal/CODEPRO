import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ClerkProvider } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.error('❌ VITE_CLERK_PUBLISHABLE_KEY is missing!');
  console.error('Available env vars:', Object.keys(import.meta.env));
  throw new Error('Missing Clerk Publishable Key - Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file');
}

console.log('✅ Clerk Publishable Key found:', PUBLISHABLE_KEY.substring(0, 20) + '...');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      elements: {
        // Customize if needed
      }
    }}
    afterSignInUrl="/dashboard"
    afterSignUpUrl="/dashboard"
    signInUrl="/login"
    signUpUrl="/login"
  >
    <App />
  </ClerkProvider>
);