# 🚀 Quick Start Checklist

## Step 1: Environment Variables

### Backend `.env`
```bash
cd BackEnd
```

Create/Edit `.env` file:
```env
CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
MONGODB_URI=mongodb://localhost:27017/codepro
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:4000
GEMINI_API_KEY=your-gemini-key
GITHUB_CLIENT_ID=your-github-id
GITHUB_CLIENT_SECRET=your-github-secret
```

### Frontend `.env`
```bash
cd FrontEnd
```

Create/Edit `.env` file:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_GITHUB_CLIENT_ID=your-github-id
```

---

## Step 2: Get Clerk Keys

1. Go to https://dashboard.clerk.com/
2. Create/Select your application
3. Go to **API Keys** section
4. Copy:
   - Publishable key (starts with `pk_test_`)
   - Secret key (starts with `sk_test_`)

---

## Step 3: Configure Clerk Dashboard

1. **Allowed Origins** (Settings → URLs → Allowed origins):
   - Add: `http://localhost:4000`
   - Add: `http://localhost:5000`

2. **Sign-in Methods** (User & Authentication → Email, Phone, Username):
   - ✅ Enable Email
   - ✅ Enable Password

3. **OAuth Providers** (optional):
   - ✅ Enable Google
   - ✅ Enable GitHub

---

## Step 4: Start Services

### Terminal 1 - MongoDB (if local)
```bash
mongod
# or
brew services start mongodb-community
```

### Terminal 2 - Backend
```bash
cd BackEnd
npm install
npm run dev
```

**Expected output:**
```
MongoDB Connected: localhost
Server running on port 5000
WebSocket server is ready
```

### Terminal 3 - Frontend
```bash
cd FrontEnd
npm install
npm run dev
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:4000/
```

---

## Step 5: Test Sign Up

1. Open browser: `http://localhost:4000`
2. Open DevTools: Press `F12`
3. Click **"Start Free Trial"**
4. Fill in sign-up form
5. Check console for ✅ success messages

---

## ✅ Success Indicators

### Browser Console Should Show:
```
✅ Clerk Publishable Key found: pk_test_...
✅ WebSocket connected! Socket ID: ...
```

### Backend Terminal Should Show:
```
✅ Client connected: socket_id
✅ New user created: user@example.com
```

### You Should See:
- ✅ Sign-up form appears
- ✅ No red errors in console
- ✅ After sign-up → redirected to `/dashboard`
- ✅ Your name appears in navbar

---

## ❌ Common Issues

| Issue | Solution |
|-------|----------|
| "Missing Clerk Publishable Key" | Add `VITE_CLERK_PUBLISHABLE_KEY` to `FrontEnd/.env` |
| CSP errors | Clear cache: `Ctrl+Shift+Delete` |
| 401 from Cloudflare | Hard refresh: `Ctrl+Shift+R` |
| Clerk modal doesn't appear | Check Clerk Dashboard → Allowed Origins |
| MongoDB connection error | Start MongoDB service |
| Port already in use | Kill process: `lsof -ti:5000 \| xargs kill -9` |

---

## 🔍 Quick Debug Commands

```bash
# Check if ports are in use
lsof -i :5000  # Backend
lsof -i :4000  # Frontend

# Check MongoDB status
mongosh  # Connect to MongoDB
# or
brew services list | grep mongodb

# View environment variables (Frontend)
cd FrontEnd
npm run dev
# Then in browser console:
console.log(import.meta.env)

# Test backend health
curl http://localhost:5000/health
```

---

## 📞 Next Steps After Success

1. ✅ Connect GitHub repository
2. ✅ Open a pull request
3. ✅ Watch AI review your code
4. ✅ Check WebSocket real-time updates

---

## 🎯 Quick Test Checklist

- [ ] MongoDB running
- [ ] Backend running on port 5000
- [ ] Frontend running on port 4000
- [ ] Both `.env` files created
- [ ] Clerk keys added
- [ ] No errors in browser console
- [ ] Can access http://localhost:4000
- [ ] Sign-up modal appears
- [ ] Can create account
- [ ] Redirected to dashboard
- [ ] User in MongoDB

---

**Time to Complete**: ~10 minutes
**Difficulty**: Easy 🟢

Good luck! 🚀

