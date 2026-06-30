-- Features Migration: All new tables
-- E2EE Keys
CREATE TABLE IF NOT EXISTS encryption_keys (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, public_key TEXT NOT NULL, private_key_encrypted TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Scheduled Messages
CREATE TABLE IF NOT EXISTS scheduled_messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), sender_id TEXT NOT NULL, sender_name TEXT, content TEXT NOT NULL, room_id TEXT NOT NULL, scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Custom Emojis
CREATE TABLE IF NOT EXISTS custom_emojis (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL UNIQUE, url TEXT NOT NULL, created_by TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Chat Themes
CREATE TABLE IF NOT EXISTS chat_themes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, name TEXT NOT NULL, colors JSONB NOT NULL, background_url TEXT, font_family TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Read Receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), message_id TEXT NOT NULL, user_id TEXT NOT NULL, read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(message_id, user_id));
-- Chat Folders
CREATE TABLE IF NOT EXISTS chat_folders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, name TEXT NOT NULL, icon TEXT, color TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS folder_rooms (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), folder_id UUID REFERENCES chat_folders(id) ON DELETE CASCADE, room_id TEXT NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Polls
CREATE TABLE IF NOT EXISTS polls (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id TEXT NOT NULL, created_by TEXT NOT NULL, question TEXT NOT NULL, options JSONB NOT NULL, multiple_choice BOOLEAN DEFAULT false, anonymous BOOLEAN DEFAULT false, expires_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
CREATE TABLE IF NOT EXISTS poll_votes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), poll_id UUID REFERENCES polls(id) ON DELETE CASCADE, user_id TEXT NOT NULL, option_index INTEGER NOT NULL, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(poll_id, user_id));
-- Events
CREATE TABLE IF NOT EXISTS events (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id TEXT NOT NULL, created_by TEXT NOT NULL, title TEXT NOT NULL, description TEXT, event_date TIMESTAMP WITH TIME ZONE NOT NULL, duration INTEGER, location TEXT, attendees JSONB, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Tasks
CREATE TABLE IF NOT EXISTS tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id TEXT NOT NULL, created_by TEXT NOT NULL, assigned_to TEXT NOT NULL, title TEXT NOT NULL, description TEXT, priority TEXT DEFAULT 'medium', status TEXT DEFAULT 'pending', due_date TIMESTAMP WITH TIME ZONE, completed_at TIMESTAMP WITH TIME ZONE, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, message_id TEXT NOT NULL, note TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), UNIQUE(user_id, message_id));
-- Device Sync
CREATE TABLE IF NOT EXISTS device_sync (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id TEXT NOT NULL, device_id TEXT NOT NULL, data JSONB NOT NULL, last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW());
-- Message columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS encrypted_data JSONB;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS parent_message_id TEXT;
-- User columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS status_message TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';