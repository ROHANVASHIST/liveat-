# 🚀 Security Quick Start Guide

Get your chat app secured with enterprise-grade authentication in 5 minutes!

---

## ⚡ Quick Setup Steps

### Step 1: Run Database Migration (2 minutes)

Connect to your Supabase database and run the security schema:

```bash
# Option A: Using Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to SQL Editor
4. Copy contents from backend/supabase-security-migration.sql
5. Execute the SQL

# Option B: Using psql
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f backend/supabase-security-migration.sql
```

### Step 2: Configure Environment Variables (1 minute)

**Backend** (`backend/.env`):
```env
# Generate strong secrets (run in terminal):
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

JWT_SECRET=<generated-64-char-hex-string>
JWT_REFRESH_SECRET=<generated-64-char-hex-string>

# For localhost development
RP_ID=localhost
ORIGIN=http://localhost:5173
```

**Frontend** (`.env`):
```env
VITE_BACKEND_URL=http://localhost:3000
```

### Step 3: Install Dependencies (1 minute)

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ..
npm install
```

### Step 4: Start Servers (1 minute)

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd ..
npm run dev
```

---

## ✅ Verify Installation

1. Open http://localhost:5173
2. Sign in to your account
3. Navigate to **Settings** → **Security**
4. You should see three security sections:
   - ✅ Two-Factor Authentication
   - ✅ Biometric Passkeys
   - ✅ Active Sessions

---

## 🔐 Enable Security Features

### Enable MFA (1 minute)

1. Click **"Setup MFA"**
2. Scan QR code with Google Authenticator / Authy
3. Enter 6-digit code
4. Save backup codes securely

**Done!** Your account now requires 2FA on login.

### Register Passkey (30 seconds)

1. Click **"Register Passkey"**
2. Follow browser prompts (fingerprint/face/PIN)
3. Passkey registered!

**Done!** You can now sign in with biometrics.

---

## 🧪 Test Your Security Setup

### Test 1: MFA Login Flow
```bash
1. Log out of the app
2. Log back in with email/password
3. You should be prompted for 6-digit MFA code
4. Enter code from authenticator app
5. Successfully logged in ✅
```

### Test 2: Passkey Authentication
```bash
1. Log out of the app
2. On login screen, click "Use Passkey"
3. Use fingerprint/face/PIN
4. Instantly logged in ✅
```

### Test 3: Session Management
```bash
1. Open app in different browser
2. Log in (creates second session)
3. Go to Settings → Security → Active Sessions
4. You should see 2 active sessions
5. Click "Revoke" on one → that session is terminated ✅
```

---

## 🛡️ Security Checklist for Production

Before deploying to production, ensure:

- [ ] **Strong Secrets**: Replace all JWT secrets with 64+ character random strings
- [ ] **HTTPS Enabled**: Configure SSL certificates (Let's Encrypt, Cloudflare)
- [ ] **Domain Configuration**: Update `RP_ID` to your domain (e.g., `chat.example.com`)
- [ ] **Origin Update**: Set `ORIGIN` to your production URL
- [ ] **CORS Configuration**: Update `corsOptions` in `backend/src/security/enhancedSecurity.ts`
- [ ] **Rate Limits**: Adjust rate limits based on expected traffic
- [ ] **Database Backups**: Enable automated Supabase backups
- [ ] **Monitoring**: Set up error tracking (Sentry, LogRocket)
- [ ] **Security Headers**: Verify Helmet configuration
- [ ] **Audit Logging**: Enable and monitor security audit logs

---

## 🔧 Production Environment Variables

**Backend Production** (`backend/.env`):
```env
NODE_ENV=production

# Strong JWT Secrets (64+ chars)
JWT_SECRET=<production-secret-64-chars>
JWT_REFRESH_SECRET=<production-refresh-secret-64-chars>

# Your production domain
RP_ID=chat.yourdomain.com
ORIGIN=https://chat.yourdomain.com

# Supabase Production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your-production-secret

# Frontend URL
FRONTEND_URL=https://chat.yourdomain.com
```

**Frontend Production** (`.env`):
```env
VITE_BACKEND_URL=https://api.yourdomain.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

---

## 🆘 Common Issues & Solutions

### Issue: "Passkey registration failed"
**Solution**: Ensure HTTPS is enabled. WebAuthn requires secure context.

### Issue: "MFA QR code won't scan"
**Solution**: Try manual entry. Copy the secret key and enter it in your authenticator app.

### Issue: "Token refresh failing"
**Solution**: Check if JWT secrets match between token generation and verification.

### Issue: "CORS errors in browser console"
**Solution**: Update `corsOptions` in `backend/src/security/enhancedSecurity.ts` with your frontend URL.

---

## 📚 Next Steps

Now that security is configured:

1. **Read Full Documentation**: See `SECURITY_IMPLEMENTATION.md`
2. **Test All Flows**: Run through all authentication scenarios
3. **Enable Audit Logging**: Monitor security events
4. **Set Up Alerts**: Get notified of suspicious activities
5. **Regular Updates**: Keep dependencies updated

---

## 💡 Pro Tips

- **Backup Codes**: Store them in a password manager
- **Multiple Passkeys**: Register passkeys on multiple devices
- **Session Review**: Regularly check active sessions
- **Audit Logs**: Review security logs weekly
- **Security Updates**: Subscribe to security advisories

---

## 🎯 Security Levels Achieved

✅ **Basic**: Email/Password authentication  
✅ **Enhanced**: MFA (2FA) with TOTP  
✅ **Advanced**: Biometric Passkeys (WebAuthn)  
✅ **Enterprise**: Session management, audit logging, JWT tokens  
✅ **Expert**: End-to-end encryption, rate limiting, security headers  

---

## 📞 Need Help?

- **Documentation**: See `SECURITY_IMPLEMENTATION.md`
- **Issues**: Check troubleshooting section above
- **Security Concerns**: Review OWASP guidelines

---

**🎉 Congratulations!** Your chat app now has enterprise-grade security with multi-factor authentication and biometric passkeys!

*Last Updated: 2026-06-25*
