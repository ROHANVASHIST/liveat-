# Universal Deployment Plan

This document outlines the end-to-end plan to deploy the Concierge OS Chat Application across multiple devices (desktops, laptops, phones, and tablets) globally. 

## 1. Hosting Architecture
### Frontend (Vite + React)
- **Host**: Vercel or Cloudflare Pages.
- **Why**: Both offer top-tier edge-caching for static sites. Because the frontend relies on environment variables, we securely configure `VITE_SUPABASE_URL` and `VITE_BACKEND_URL` in the deployment settings. Zero dev-ops required.

### Backend (Node.js + Express WebSocket Server)
- **Host**: Railway, Render, or Fly.io.
- **Why**: WebSocket connectivity needs sustained instances. A platform like Railway allows easy deployment of persistent environments. 
- **Configuration**: Expose `PORT`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `FRONTEND_URL` (to handle Google Auth redirects securely to production).

### Database & Auth (Supabase)
- Currently, the application already points to a Supabase Postgres instance. This database should stay in the cloud, and its settings must ensure CORS whitelist matching the Vercel frontend URL.

## 2. PWA (Progressive Web App) Implementation (For Multi-Device Install)
To ensure the app feels "native" on phones and desktop without publishing to App Stores:

1. Add `vite-plugin-pwa` to the `package.json`.
2. Configure a `manifest.json` defining the app's `standalone` display mode, name, and theme color (Dark Protocol).
3. The platform can then be instantly installed as a dedicated app on iOS, Android, and MacOS directly from the browser window. Our `InstallPrompt` script is already injected and waiting for PWA resolution.

## 3. Strong Security & Tight Encryption
- **AES-256 Front-to-Back**: We've securely integrated `crypto-js` using standard AES algorithms on the client interface (`src/lib/encryption.ts`).
- **Data Flow**: Every message explicitly encrypts using the environment variable key (`VITE_ENCRYPTION_KEY`) before touching a WebSocket or the Database. 
- **Database Safety**: The database stores impenetrable hashes. If the backend is compromised, attackers only retrieve AES payloads that require the front-end keys to decrypt.

## 4. Expected Deployment Procedure
1. Register domains (e.g. `chat.concierge-os.com`).
2. Push all code to your GitHub Repository.
3. Link the frontend repo in **Vercel**.
4. Link the backend repo in **Railway** (configured as a continuous service, not serverless).
5. Add the domain `chat.concierge-os.com` as an allowed Redirect URI in Google Cloud Console.
6. Share the link across all your devices and save to home screen!
