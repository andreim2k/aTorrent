# Google OAuth Setup Guide

## ✅ What's Been Done

Your login page now has **Google Sign-In** integration! Here's what was added:

### Frontend Changes
✅ Google Sign-In button added to login page  
✅ Password login moved to fallback option  
✅ Proper error handling for Google auth  
✅ Loading states and user feedback  
✅ Rate limiting error messages  

### Login Page Now Shows:
1. **Google Sign-In button** (recommended method)
2. **"or use password"** divider
3. **Password login** (fallback method)

---

## 🔧 Setup Instructions

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing one
3. Click **"Create Credentials"** → **"OAuth 2.0 Client ID"**
4. Choose **"Web application"**
5. Add **Authorized redirect URIs:**
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000
   http://localhost:3000/login.html
   ```
6. Copy your **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

### Step 2: Configure Backend

Edit `backend/.env`:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Optional: Restrict to specific email domains (comma-separated)
# Leave empty to allow all Google accounts
ALLOWED_GOOGLE_DOMAINS=yourdomain.com,anotherdomain.com
```

### Step 3: Configure Frontend

Edit `frontend/src/login.html` - **Replace line 71 and 220:**

```javascript
// Line 71 - Replace YOUR_GOOGLE_CLIENT_ID
data-client_id="YOUR_ACTUAL_CLIENT_ID"

// Line 220 - Replace YOUR_GOOGLE_CLIENT_ID
client_id: 'YOUR_ACTUAL_CLIENT_ID',
```

**Example:**
```javascript
// Line 71
data-client_id="123456789-abc123def456.apps.googleusercontent.com"

// Line 220
client_id: '123456789-abc123def456.apps.googleusercontent.com',
```

### Step 4: Restart Services

```bash
./app.sh restart all
```

Or manually:
```bash
# Restart backend to load new .env
./app.sh restart backend

# Frontend reload (just refresh browser)
```

---

## 🎨 What You'll See

### Updated Login Page:

```
┌─────────────────────────────────────┐
│          @Torrent                   │
│    a Fast Torrent Client            │
│                                     │
│   [Sign in with Google Button]     │
│                                     │
│   ────── or use password ──────    │
│                                     │
│   [Password Field]                  │
│   [Login with Password Button]      │
│                                     │
│   💡 Google Sign-In is recommended  │
│   Configure GOOGLE_CLIENT_ID...     │
└─────────────────────────────────────┘
```

---

## 🧪 Testing

### Test Google OAuth:
1. Navigate to `http://localhost:3000/login.html`
2. Click **"Sign in with Google"**
3. Choose your Google account
4. Should redirect to dashboard

### Test Password Login:
1. Enter password
2. Click **"Login with Password"**
3. Should work as before

### Test Rate Limiting:
1. Try wrong password 6 times quickly
2. Should see: "Too many attempts. Please try again later."

---

## 🔒 Security Features

Your Google OAuth implementation includes:

✅ **Email verification** - Only verified Google emails  
✅ **Domain restrictions** - Optional whitelist  
✅ **Token rotation** - Enhanced security  
✅ **Rate limiting** - Prevents abuse  
✅ **Secure cookies** - SameSite=Lax  
✅ **HTTPS ready** - Production-ready  

---

## 🐛 Troubleshooting

### "Google authentication not configured"
**Solution:** Make sure `GOOGLE_CLIENT_ID` is set in `backend/.env` and restart backend

### Google button doesn't appear
**Solution:** 
1. Check browser console for errors
2. Make sure you replaced `YOUR_GOOGLE_CLIENT_ID` in login.html (2 places)
3. Verify Google Sign-In library is loading

### "Email not authorized"
**Solution:** 
- Check `ALLOWED_GOOGLE_DOMAINS` in `.env`
- Remove it to allow all Google accounts
- Or add your email domain to the list

### Redirect URI mismatch
**Solution:** 
1. Go to Google Cloud Console
2. Add your exact URL to Authorized redirect URIs
3. Include: `http://localhost:3000`, `http://localhost:3000/login.html`

---

## 📝 Quick Setup Script

```bash
# 1. Get your Google Client ID from Google Cloud Console
# 2. Run this:

cd backend
cat >> .env << 'EOF'

# Google OAuth
GOOGLE_CLIENT_ID=PASTE_YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=PASTE_YOUR_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
ALLOWED_GOOGLE_DOMAINS=
EOF

# 3. Update login.html with your client ID (manual step)
nano ../frontend/src/login.html
# Replace YOUR_GOOGLE_CLIENT_ID on lines 71 and 220

# 4. Restart
cd ..
./app.sh restart all
```

---

## 🎯 Next Steps

After setup:
1. ✅ Test Google OAuth login
2. ✅ Test password login (fallback)
3. ✅ Configure allowed email domains if needed
4. ✅ Set up HTTPS for production
5. ✅ Update redirect URIs for production domain

---

## 🌟 Production Deployment

For production, update:

**Google Cloud Console:**
```
https://yourdomain.com/auth/callback
https://yourdomain.com/login.html
https://yourdomain.com
```

**backend/.env:**
```env
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
SECURE_COOKIES=true
DEVELOPMENT_MODE=false
```

**frontend/src/login.html:**
- Keep same Client ID
- No changes needed

---

## 📚 References

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/gsi/web)
- Backend API: `/api/v1/auth/google`
- API Docs: `http://localhost:8000/api/v1/docs`

---

**Your @Torrent now has enterprise-grade Google OAuth authentication!** 🚀


