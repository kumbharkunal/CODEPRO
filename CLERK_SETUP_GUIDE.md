# 🔧 Clerk Authentication Setup Guide

## Issue Fixed
✅ Resolved CSP (Content Security Policy) blocking Clerk scripts
✅ Added Cloudflare challenge platform to allowed domains
✅ Configured Helmet and Nginx to allow Clerk domains

---

## Required Environment Variables

### Backend `.env` file:
```env
# Clerk Authentication
CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Other required variables
MONGODB_URI=mongodb://localhost:27017/codepro
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:4000
# ... other variables
```

### Frontend `.env` file:
```env
# Clerk Authentication (IMPORTANT: Must start with VITE_)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx

# Backend API
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000

# GitHub
VITE_GITHUB_CLIENT_ID=your-github-oauth-app-client-id
```

---

## Steps to Fix Clerk Sign Up

### 1. **Get Clerk Keys**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Create a new application or select existing one
   - Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
   - Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### 2. **Configure Environment Variables**
   
   **Backend** (`BackEnd/.env`):
   ```env
   CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
   FRONTEND_URL=http://localhost:4000
   ```

   **Frontend** (`FrontEnd/.env`):
   ```env
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
   VITE_API_URL=http://localhost:5000/api
   VITE_WS_URL=http://localhost:5000
   ```

### 3. **Verify Clerk Dashboard Settings**
   
   In your Clerk application settings:
   
   ✅ **Allowed Origins:**
   - `http://localhost:4000`
   - `http://localhost:5000`
   - Your production URLs
   
   ✅ **Sign-in Methods:**
   - Enable Email/Password
   - Enable OAuth providers (Google, GitHub, etc.) as needed
   
   ✅ **Redirect URLs:**
   - Sign-in redirect: `http://localhost:4000/dashboard`
   - Sign-up redirect: `http://localhost:4000/dashboard`
   - Sign-out redirect: `http://localhost:4000/`

### 4. **Restart Your Servers**
   
   **Backend:**
   ```bash
   cd BackEnd
   npm run dev
   ```
   
   **Frontend:**
   ```bash
   cd FrontEnd
   npm run dev
   ```

### 5. **Test Sign Up**
   - Open `http://localhost:4000`
   - Click "Start Free Trial" or "Login"
   - Try signing up with email
   - Check browser console for any errors

---

## What Was Fixed

### 1. **Backend CSP Configuration** (`BackEnd/src/index.ts`)
   - Added Clerk domains to allowed script sources
   - Added Cloudflare challenge platform
   - Enabled `unsafe-inline` and `unsafe-eval` for Clerk
   - Disabled cross-origin policies that blocked Clerk

### 2. **Frontend Nginx CSP** (`FrontEnd/nginix.conf`)
   - Added Content-Security-Policy header
   - Whitelisted Clerk and Cloudflare domains

### 3. **Frontend HTML CSP** (`FrontEnd/index.html`)
   - Added meta CSP tag for development mode
   - Included WebSocket connections (ws:, wss:)

### 4. **Clerk Provider Configuration** (`FrontEnd/src/main.tsx`)
   - Added better error messages
   - Added redirect URLs
   - Added debug logging

---

## Troubleshooting

### ❌ Error: "Missing Clerk Publishable Key"
**Solution:** Make sure your frontend `.env` file has `VITE_CLERK_PUBLISHABLE_KEY` (must start with `VITE_`)

### ❌ Error: "401 from Cloudflare challenge"
**Solution:** CSP is now configured correctly. Clear browser cache and restart dev servers.

### ❌ Error: "script-src violation"
**Solution:** Changes have been made to allow Clerk scripts. Restart your servers.

### ❌ Sign up modal doesn't appear
**Solution:** 
1. Check browser console for errors
2. Verify Clerk Publishable Key is correct
3. Check that Clerk application is in "Development" mode
4. Verify allowed origins in Clerk Dashboard

### ❌ Sign up works but user not synced to backend
**Solution:**
1. Check `BackEnd/.env` has `CLERK_SECRET_KEY`
2. Verify backend is running on correct port
3. Check `VITE_API_URL` in frontend `.env`

---

## Testing Checklist

- [ ] Backend server running without errors
- [ ] Frontend server running without errors
- [ ] No CSP errors in browser console
- [ ] Clerk sign-up modal appears correctly
- [ ] Can create account with email
- [ ] OAuth providers work (if enabled)
- [ ] User redirected to dashboard after sign-up
- [ ] User data synced to MongoDB
- [ ] Can sign out and sign in again

---

## Additional Notes

### Production Deployment
When deploying to production:

1. Update Clerk Dashboard with production URLs
2. Use production Clerk keys (`pk_live_` and `sk_live_`)
3. Update CSP to include your production domains
4. Enable Clerk's production features

### Security Considerations
- `unsafe-inline` and `unsafe-eval` are required by Clerk
- This is standard for authentication providers
- Clerk has been audited and is SOC 2 Type II compliant
- Consider using Clerk's Content Security Policy documentation for tighter policies

---

## Need More Help?

1. **Check Clerk logs:** [Clerk Dashboard](https://dashboard.clerk.com/) → Your App → Logs
2. **Browser console:** Press F12 and check Console and Network tabs
3. **Backend logs:** Check terminal where backend is running
4. **Clerk Documentation:** https://clerk.com/docs

---

## Quick Start Commands

```bash
# Backend
cd BackEnd
npm install
# Create .env file with your keys
npm run dev

# Frontend (new terminal)
cd FrontEnd
npm install
# Create .env file with your keys
npm run dev
```

Then open `http://localhost:4000` in your browser! 🚀

