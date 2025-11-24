# GitHub OAuth Configuration Guide for Clerk

## 🚨 CRITICAL: Complete These Steps to Fix GitHub OAuth

Your GitHub OAuth is not working because it requires proper configuration in **both** Clerk Dashboard and GitHub Settings. Follow these steps **exactly**:

---

## Step 1: Configure GitHub OAuth in Clerk Dashboard

1. **Go to Clerk Dashboard**
   - Visit: https://dashboard.clerk.com
   - Select your application

2. **Navigate to OAuth Settings**
   - Click **"User & Authentication"** in the left sidebar
   - Click **"Social Connections"**

3. **Enable GitHub Provider**
   - Find **"GitHub"** in the list
   - Toggle it **ON** (enable it)
   - You'll see a configuration panel open

4. **Configure GitHub Settings**
   - You have two options:
   
   **Option A: Use Clerk's Shared Credentials (Recommended for Testing)**
   - Select "Use Clerk Shared Credentials"
   - This is the easiest way to get started
   - Click "Save"
   
   **Option B: Use Your Own GitHub OAuth App (Recommended for Production)**
   - Select "Use custom credentials"
   - You'll need to create a GitHub OAuth App (see Step 2 below)
   - Enter your GitHub OAuth App credentials
   - Click "Save"

5. **Note Your Callback URL**
   - Clerk will show you a callback URL
   - It looks like: `https://stable-cobra-6.clerk.accounts.dev/v1/oauth_callback`
   - **Copy this URL** - you'll need it for GitHub OAuth App setup

---

## Step 2: Create GitHub OAuth App (Only if using custom credentials)

If you chose "Use custom credentials" in Step 1, follow these steps:

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Click **"OAuth Apps"** in the left sidebar
   - Click **"New OAuth App"** button

2. **Fill in Application Details**
   ```
   Application name: CodePro
   Homepage URL: http://localhost:4000
   Application description: AI-Powered PR Review Tool
   Authorization callback URL: [PASTE THE CALLBACK URL FROM CLERK]
   ```
   
   **⚠️ IMPORTANT**: The callback URL **MUST EXACTLY MATCH** the one from Clerk!

3. **Register Application**
   - Click **"Register application"**

4. **Get Client Credentials**
   - You'll see **Client ID** - copy it
   - Click **"Generate a new client secret"**
   - Copy the **Client Secret** immediately (you won't see it again!)

5. **Add Credentials to Clerk**
   - Go back to Clerk Dashboard
   - In GitHub OAuth settings, paste:
     - Client ID
     - Client Secret
   - Click **"Save"**

---

## Step 3: Verify Clerk Configuration in Your Code

Check that you have the correct Clerk Publishable Key:

### Frontend (.env file)
```bash
# Make sure this exists and is correct
VITE_CLERK_PUBLISHABLE_KEY=pk_test_c3RhYmxlLWNvYnJhLTYuY2xlcmsuYWNjb3VudHMuZGV2JA

# Should match your Clerk account
# Get it from: Clerk Dashboard → API Keys → Publishable Key
```

### Backend (.env file)
```bash
# Make sure these exist and are correct
CLERK_PUBLISHABLE_KEY=pk_test_c3RhYmxlLWNvYnJhLTYuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_f0Evxg5rATCOHze6ZukLKNEzEW8EaOtFZw3QnLP1j9

# Get these from: Clerk Dashboard → API Keys
```

---

## Step 4: Test GitHub OAuth

1. **Start Your Development Servers**
   ```bash
   # Terminal 1 - Backend
   cd BackEnd
   npm run dev
   
   # Terminal 2 - Frontend
   cd FrontEnd
   npm run dev
   ```

2. **Test Sign-Up with GitHub**
   - Go to http://localhost:4000/login
   - Make sure you're on **"Sign Up"** tab
   - Click **"Continue with GitHub"**
   - Authorize the app on GitHub
   - You should be redirected to dashboard
   - Check MongoDB - new user should be created

3. **Test Sign-In with GitHub**
   - Log out (if logged in)
   - Go to http://localhost:4000/login
   - Make sure you're on **"Sign In"** tab
   - Click **"Continue with GitHub"**
   - Should log you in immediately (no new user created)
   - You should be redirected to dashboard

---

## Common Issues & Solutions

### Issue 1: "OAuth Access Denied" Error
**Solution**: User clicked "Cancel" on GitHub authorization page. This is normal - just try again.

### Issue 2: "OAuth Callback Error"
**Causes**:
- Callback URL in GitHub OAuth App doesn't match Clerk's callback URL
- GitHub OAuth App is not properly configured

**Solutions**:
1. Check GitHub OAuth App callback URL matches Clerk exactly
2. Make sure GitHub OAuth is enabled in Clerk Dashboard
3. Try using "Clerk Shared Credentials" instead of custom credentials

### Issue 3: "Email Already Exists"
**Cause**: You previously signed up with this email using a different method (Google or Email/Password)

**Solution**: Sign in using your original method, or use a different email for GitHub OAuth

### Issue 4: GitHub OAuth Button Does Nothing
**Causes**:
- Missing Clerk Publishable Key
- Network error
- Clerk service is down

**Solutions**:
1. Check browser console for errors
2. Verify VITE_CLERK_PUBLISHABLE_KEY is set in .env
3. Check Clerk Dashboard status page

### Issue 5: Infinite Redirect Loop
**Cause**: Redirect URLs not configured correctly

**Solution**:
1. Make sure redirect URLs in code match:
   ```typescript
   // In LoginPage.tsx - should be:
   redirectUrl: `${window.location.origin}/dashboard`
   redirectUrlComplete: `${window.location.origin}/dashboard`
   ```

2. Make sure ClerkProvider has correct redirect URLs:
   ```typescript
   // In main.tsx
   signInFallbackRedirectUrl="/dashboard"
   signUpFallbackRedirectUrl="/dashboard"
   ```

---

## Debugging Checklist

If GitHub OAuth still doesn't work after configuration:

- [ ] GitHub OAuth is enabled in Clerk Dashboard
- [ ] Callback URL in GitHub OAuth App matches Clerk's callback URL exactly
- [ ] VITE_CLERK_PUBLISHABLE_KEY is set in frontend .env
- [ ] CLERK_SECRET_KEY is set in backend .env
- [ ] Both frontend and backend servers are running
- [ ] No errors in browser console
- [ ] No errors in backend terminal
- [ ] Tried clearing browser cache and cookies
- [ ] Tried in incognito/private browser window

---

## Testing Different Scenarios

### Test 1: New User Sign-Up
1. Use a GitHub account that has **never** signed up for CodePro
2. Click "Continue with GitHub" on **Sign Up** tab
3. Expected: User created, team created, redirected to dashboard

### Test 2: Existing User Sign-In
1. Use a GitHub account that **already** signed up for CodePro
2. Click "Continue with GitHub" on **Sign In** tab
3. Expected: Signed in, redirected to dashboard, no duplicate user created

### Test 3: User Cancels Authorization
1. Click "Continue with GitHub"
2. On GitHub authorization page, click "Cancel"
3. Expected: Error message shown: "GitHub sign-in was canceled. Please try again when ready."

### Test 4: Wrong Tab
1. Have an existing user try signing up again
2. Expected: Either merges accounts or shows "Email already exists" error

---

## Need More Help?

If GitHub OAuth still doesn't work after following all steps:

1. **Check Clerk Dashboard Logs**
   - Clerk Dashboard → Logs
   - Look for GitHub OAuth errors
   - Check what error codes are returned

2. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for red errors
   - Check Network tab for failed requests

3. **Check Backend Logs**
   - Look at your backend terminal
   - Check for authentication errors
   - Look for sync errors

4. **Enable Debug Mode**
   - In LoginPage.tsx, check console logs
   - Detailed OAuth error info is logged in development mode

---

## Quick Reference

### Clerk Dashboard URLs
- Main Dashboard: https://dashboard.clerk.com
- Social Connections: Dashboard → User & Authentication → Social Connections
- API Keys: Dashboard → API Keys

### GitHub Settings URLs
- OAuth Apps: https://github.com/settings/developers
- OAuth App Settings: https://github.com/settings/applications/[app-id]

### Your Callback URL Format
```
https://[your-clerk-app-id].clerk.accounts.dev/v1/oauth_callback
```

Example:
```
https://stable-cobra-6.clerk.accounts.dev/v1/oauth_callback
```
