# liveat - Real-time Chat Application

A WhatsApp-like chat application with Google OAuth authentication and Supabase database integration.

## Features

- Real-time messaging via WebSocket
- Google OAuth authentication
- Message history stored in Supabase
- Image file support
- Room creation and management
- User presence indicators
- Digital Brutalism design
- Responsive mobile-friendly UI

## Setup Instructions

### 1. Supabase Setup

1. Go to your Supabase project: https://flfstoclxdykhflawrza.supabase.co
2. Navigate to SQL Editor
3. Run the SQL script from `backend/supabase-schema.sql`
4. This will create:
   - `users` table
   - `rooms` table
   - `messages` table
   - Default rooms (General, Tech Talk, Random)

### 2. Backend Setup

```bash
cd backend
npm install
npm run dev
```

The backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Google OAuth Setup

Your Google OAuth is already configured with:
- Client ID: `612995325524-vb0l65kqm0ciejkucdtmrimgseusocgt.apps.googleusercontent.com`
- Redirect URI: `http://localhost:3000/api/google/auth/callback`

Make sure these are added to your Google Cloud Console:
1. Go to https://console.cloud.google.com/
2. Navigate to APIs & Services > Credentials
3. Add `http://localhost:3000/api/google/auth/callback` to Authorized redirect URIs
4. Add `http://localhost:5173` to Authorized JavaScript origins

## Usage

1. Open `http://localhost:5173` in your browser
2. Enter your full name OR click "Sign in with Google"
3. Start chatting in real-time!

## Features

- **Real-time messaging**: Messages appear instantly for all users
- **Message history**: All messages are stored in Supabase
- **Room management**: Create custom chat rooms
- **Contact management**: Add contacts for direct messaging
- **Image sharing**: Upload and share images
- **Google OAuth**: Secure authentication with Google
- **Responsive design**: Works on desktop and mobile

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui components
- Supabase client
- WebSocket API

### Backend
- Node.js + Express + TypeScript
- WebSocket (ws library)
- Passport.js (Google OAuth)
- Supabase
- Helmet, Morgan, CORS

## Environment Variables

Backend `.env`:
```
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://flfstoclxdykhflawrza.supabase.co
SUPABASE_SECRET_KEY=your_secret_key
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google/auth/callback
```

## Database Schema

### users
- id (UUID)
- google_id (TEXT)
- email (TEXT)
- name (TEXT)
- avatar (TEXT)
- created_at (TIMESTAMP)

### rooms
- id (UUID)
- name (TEXT)
- description (TEXT)
- type (TEXT)
- created_at (TIMESTAMP)

### messages
- id (UUID)
- sender_id (TEXT)
- sender_name (TEXT)
- content (TEXT)
- room_id (TEXT)
- message_type (TEXT)
- media_url (TEXT)
- created_at (TIMESTAMP)

## License

MIT
