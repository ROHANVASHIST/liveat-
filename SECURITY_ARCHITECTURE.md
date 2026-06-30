# 🏗️ Security Architecture Diagram

## Multi-Layered Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER / CLIENT DEVICE                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Browser    │  │ Fingerprint  │  │  Face ID /   │                  │
│  │  WebAuthn    │  │   Scanner    │  │  Touch ID    │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                  │                           │
│         └─────────────────┴──────────────────┘                           │
│                           │                                              │
│                  ┌────────▼────────┐                                     │
│                  │  WebAuthn API   │                                     │
│                  │  (Browser API)  │                                     │
│                  └────────┬────────┘                                     │
│                           │                                              │
└───────────────────────────┼──────────────────────────────────────────────┘
                            │
                            │ HTTPS/TLS 1.3
                            │ Certificate Pinning
                            │
┌───────────────────────────▼──────────────────────────────────────────────┐
│                      API GATEWAY / BACKEND                               │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                  SECURITY MIDDLEWARE LAYER                       │    │
│  │                                                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │  Helmet  │ │   CORS   │ │   Rate   │ │   XSS    │           │    │
│  │  │ Headers  │ │  Policy  │ │ Limiting │ │ Filter   │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │                                                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │  Input   │ │ SQL/NoSQL│ │   HPP    │ │ Security │           │    │
│  │  │Sanitize  │ │Injection │ │ Protect  │ │  Logger  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              AUTHENTICATION & AUTHORIZATION LAYER               │    │
│  │                                                                   │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │    │
│  │  │  MFA Service     │  │  Passkey Service │  │ Token Service│  │    │
│  │  │  (TOTP/2FA)      │  │   (WebAuthn)     │  │  (JWT)       │  │    │
│  │  │                  │  │                  │  │              │  │    │
│  │  │ • QR Generation  │  │ • Registration   │  │ • Access     │  │    │
│  │  │ • Code Verify    │  │ • Authentication │  │ • Refresh    │  │    │
│  │  │ • Backup Codes   │  │ • Challenge Flow │  │ • Rotation   │  │    │
│  │  │ • Enable/Disable │  │ • Multi-Device   │  │ • Revocation │  │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    API ENDPOINTS LAYER                           │    │
│  │                                                                   │    │
│  │  /api/security/mfa/*          - MFA Management                   │    │
│  │  /api/security/passkey/*      - Passkey Registration/Auth        │    │
│  │  /api/security/sessions/*     - Session Management               │    │
│  │  /api/security/token/refresh  - Token Refresh                    │    │
│  │  /api/security/audit-log      - Security Event Logs              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└───────────────────────────┬───────────────────────────────────────────────┘
                            │
                            │ Encrypted Connection
                            │ RLS Policies
                            │
┌───────────────────────────▼──────────────────────────────────────────────┐
│                      DATABASE LAYER (Supabase)                           │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    SECURITY TABLES                               │    │
│  │                                                                   │    │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │    │
│  │  │ user_mfa_settings│  │user_authenticators│  │user_sessions│  │    │
│  │  │                  │  │                  │  │             │  │    │
│  │  │ • TOTP Secret    │  │ • Credential ID  │  │ • Access    │  │    │
│  │  │ • Backup Codes   │  │ • Public Key     │  │ • Refresh   │  │    │
│  │  │ • MFA Status     │  │ • Counter        │  │ • Device    │  │    │
│  │  │ • Timestamps     │  │ • Transports     │  │ • IP/Agent  │  │    │
│  │  └──────────────────┘  └──────────────────┘  └──────────────┘  │    │
│  │                                                                   │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │    │
│  │  │security_audit_log│  │passkey_challenges│                     │    │
│  │  │                  │  │                  │                     │    │
│  │  │ • Event Type     │  │ • Challenge      │                     │    │
│  │  │ • User ID        │  │ • Type           │                     │    │
│  │  │ • IP Address     │  │ • Expiration     │                     │    │
│  │  │ • Timestamp      │  │ • Temporary      │                     │    │
│  │  └──────────────────┘  └──────────────────┘                     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               ROW LEVEL SECURITY (RLS)                           │    │
│  │                                                                   │    │
│  │  • Users can only access their own MFA settings                  │    │
│  │  • Users can only view/delete their own passkeys                 │    │
│  │  • Users can only manage their own sessions                      │    │
│  │  • Users can only view their own audit logs                      │    │
│  │  • Automatic data isolation and protection                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow Diagrams

### 🔐 MFA (Two-Factor Authentication) Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  User    │                    │  Backend │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. Request MFA Setup          │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 2. Generate TOTP Secret       │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ 3. Store Secret (pending)     │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │ 4. Return QR Code + Backup    │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ 5. Scan QR with Auth App      │                               │
     │                               │                               │
     │ 6. Submit 6-digit code        │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 7. Verify Code                │
     │                               │                               │
     │                               │ 8. Enable MFA                 │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │ 9. MFA Enabled Success        │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
```

### 🔑 Passkey (WebAuthn) Registration Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User    │    │ Browser  │    │  Backend │    │ Database │    │ Hardware │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │               │
     │ 1. Register   │               │               │               │
     │   Passkey     │               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 2. Request Options            │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │               │ 3. Gen Challenge              │
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │ 4. Challenge  │               │               │
     │               │<──────────────┤               │               │
     │               │               │               │               │
     │               │ 5. Start WebAuthn             │               │
     │               ├───────────────────────────────────────────────>│
     │               │               │               │               │
     │ 6. Biometric  │               │               │ 7. Generate  │
     │   Prompt      │               │               │   Keypair    │
     │<──────────────┤               │               │   (TPM)      │
     │               │               │               │               │
     │ 8. Fingerprint│               │               │ 9. Sign      │
     │    /Face      │               │               │   Challenge  │
     ├──────────────>│               │               │               │
     │               │               │               │<──────────────┤
     │               │               │               │               │
     │               │ 10. Credential                │               │
     │               │<───────────────────────────────────────────────┤
     │               │               │               │               │
     │               │ 11. Verify Credential         │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │               │ 12. Store Public Key          │
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │ 13. Success   │               │               │               │
     │<──────────────┤<──────────────┤               │               │
     │               │               │               │               │
```

### 🎫 JWT Token Authentication Flow

```
┌──────────┐                    ┌──────────┐                    ┌──────────┐
│  Client  │                    │  Backend │                    │ Database │
└────┬─────┘                    └────┬─────┘                    └────┬─────┘
     │                               │                               │
     │ 1. Login (email/pass/MFA)     │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 2. Verify Credentials         │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ 3. User Valid                 │
     │                               │<──────────────────────────────┤
     │                               │                               │
     │                               │ 4. Generate Token Pair        │
     │                               │   • Access (15 min)           │
     │                               │   • Refresh (7 days)          │
     │                               │                               │
     │                               │ 5. Store Session              │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │ 6. Return Tokens              │                               │
     │<──────────────────────────────┤                               │
     │   (httpOnly cookies)          │                               │
     │                               │                               │
     │ 7. API Request + Access Token │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 8. Verify JWT                 │
     │                               │                               │
     │ 9. Protected Resource         │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
     │ 10. Token Expired             │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │ 11. Send Refresh Token        │                               │
     ├──────────────────────────────>│                               │
     │                               │                               │
     │                               │ 12. Verify Refresh Token      │
     │                               ├──────────────────────────────>│
     │                               │                               │
     │                               │ 13. Generate New Access       │
     │                               │                               │
     │ 14. New Access Token          │                               │
     │<──────────────────────────────┤                               │
     │                               │                               │
```

---

## Security Event Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SECURITY EVENT                                │
│                   (Login, MFA, Passkey, etc.)                        │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Security Middleware │
                  │  • Log Event         │
                  │  • Extract Metadata  │
                  │  • IP Address        │
                  │  • User Agent        │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │   logSecurityEvent() │
                  │  • Event Type        │
                  │  • User ID           │
                  │  • Success/Failure   │
                  │  • Event Data        │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  security_audit_log  │
                  │  Database Table      │
                  │  • Permanent Record  │
                  │  • Compliance        │
                  │  • Forensics         │
                  └──────────────────────┘
```

---

## Data Encryption Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE ENCRYPTION                             │
│                                                                       │
│  Plain Message  ──────>  AES-256 Encrypt  ──────> Encrypted Payload │
│       │                      (CryptoJS)                   │           │
│       │                                                   │           │
│   User Types                                        Base64 Encoded    │
│    Message                                                │           │
│                                                           │           │
└───────────────────────────────────────────────────────────┼───────────┘
                                                            │
                                            HTTPS/TLS 1.3  │
                                            Transport       │
                                            Encryption      │
                                                            │
┌───────────────────────────────────────────────────────────▼───────────┐
│                    SERVER-SIDE STORAGE                                │
│                                                                       │
│  Encrypted Message  ──────> Database  ──────> Never Decrypted       │
│       │                   (Supabase)                                  │
│       │                                                               │
│  Server never                                                         │
│  sees plaintext                                                       │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

                            Recipient Retrieves
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE DECRYPTION                             │
│                                                                       │
│  Encrypted Message ──────> AES-256 Decrypt ──────> Plain Message    │
│                              (CryptoJS)                               │
│                                                                       │
│                          Displayed to User                            │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## Rate Limiting Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      RATE LIMITER LAYERS                         │
│                                                                  │
│  Layer 1: Global Rate Limit (100 req/15min)                     │
│  ├─> All endpoints                                               │
│  ├─> Per IP address                                              │
│  └─> Helmet + express-rate-limit                                 │
│                                                                  │
│  Layer 2: Sensitive Endpoint Limits                              │
│  ├─> MFA Verification: 5 attempts / 5 minutes                    │
│  ├─> Passkey Auth: 5 attempts / 5 minutes                        │
│  ├─> Token Refresh: 10 attempts / 1 minute                       │
│  └─> Custom rateLimitByIP middleware                             │
│                                                                  │
│  Layer 3: Account Lockout Protection                             │
│  ├─> failed_login_attempts table                                 │
│  ├─> Lock after 5 failed attempts                                │
│  ├─> 15-minute lockout period                                    │
│  └─> Per email + IP combination                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Hardware Security Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                      DEVICE HARDWARE                             │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   TPM Chip   │  │Secure Enclave│  │  Biometric   │          │
│  │   (Windows)  │  │   (iOS/Mac)  │  │   Sensors    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └─────────────────┴──────────────────┘                   │
│                           │                                      │
│                  ┌────────▼────────┐                             │
│                  │  Platform API   │                             │
│                  │  (WebAuthn)     │                             │
│                  └────────┬────────┘                             │
│                           │                                      │
└───────────────────────────┼──────────────────────────────────────┘
                            │
                  ┌─────────▼─────────┐
                  │  Private Key      │
                  │  • Hardware-bound │
                  │  • Non-exportable │
                  │  • TPM-protected  │
                  └───────────────────┘
```

---

*This architecture provides defense-in-depth with multiple layers of security working together to protect user accounts and data.*
