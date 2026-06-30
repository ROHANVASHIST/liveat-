-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  avatar TEXT,
  status TEXT DEFAULT 'online',
  status_message TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  room_id TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  media_storage_path TEXT,
  status TEXT DEFAULT 'sent',
  is_edited BOOLEAN DEFAULT false,
  deleted_for BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member'
);

-- Create status_updates table
CREATE TABLE IF NOT EXISTS status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NEW TABLES FOR WHATSAPP-LIKE FEATURES
-- ============================================

-- Voice messages
CREATE TABLE IF NOT EXISTS voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  duration INTEGER NOT NULL,
  audio_url TEXT,
  audio_path TEXT,
  waveform_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message edits history
CREATE TABLE IF NOT EXISTS message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_by TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Broadcast lists
CREATE TABLE IF NOT EXISTS broadcast_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES broadcast_lists(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_id, recipient_id)
);

-- Starred messages (saved messages)
CREATE TABLE IF NOT EXISTS starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Message forwarding tracking
CREATE TABLE IF NOT EXISTS forwarded_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  forwarded_by TEXT NOT NULL,
  forward_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live location sharing
CREATE TABLE IF NOT EXISTS live_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2FA settings
CREATE TABLE IF NOT EXISTS two_factor_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  secret_key TEXT,
  backup_codes TEXT[],
  qr_code_url TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Active sessions
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  device TEXT NOT NULL,
  location TEXT,
  ip_address TEXT,
  user_agent TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current_session BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User privacy settings
CREATE TABLE IF NOT EXISTS privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  last_seen VISIBILITY DEFAULT 'everyone',
  profile_photo VISIBILITY DEFAULT 'everyone',
  status VISIBILITY DEFAULT 'everyone',
  read_receipts BOOLEAN DEFAULT true,
  online_status BOOLEAN DEFAULT true,
  group_invites VISIBILITY DEFAULT 'everyone',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media quality settings
CREATE TABLE IF NOT EXISTS media_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  image_quality TEXT DEFAULT 'auto',
  video_quality TEXT DEFAULT 'auto',
  voice_message_quality TEXT DEFAULT 'standard',
  auto_download_wifi BOOLEAN DEFAULT true,
  auto_download_cellular BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat auto-delete settings
CREATE TABLE IF NOT EXISTS chat_auto_delete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  delete_after TEXT DEFAULT 'off', -- 'off', '24h', '7d', '365d'
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id)
);

-- Message reports
CREATE TABLE IF NOT EXISTS message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'action_taken'
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User security logs
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'login', 'logout', 'password_change', '2fa_enable', '2fa_disable', 'session_revoke'
  ip_address TEXT,
  device_info TEXT,
  success BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

VISIBILITY AS ENUM ('everyone', 'contacts', 'nobody');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_group_members_room_id ON group_members(room_id);
CREATE INDEX IF NOT EXISTS idx_status_updates_user_id ON status_updates(user_id);

-- Feature Indexes
CREATE INDEX IF NOT EXISTS idx_pinned_messages_room_id ON pinned_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_message_id ON pinned_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_user_id ON user_blocks(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_metric_type ON analytics_snapshots(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_created_at ON analytics_snapshots(created_at);

-- New Feature Indexes
CREATE INDEX IF NOT EXISTS idx_voice_messages_message_id ON voice_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_user_id ON voice_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_message_edits_message_id ON message_edits(message_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_lists_created_by ON broadcast_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast_id ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_starred_messages_user_id ON starred_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_starred_messages_room_id ON starred_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_forwarded_messages_original_id ON forwarded_messages(original_message_id);
CREATE INDEX IF NOT EXISTS idx_live_locations_user_id ON live_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_live_locations_expires_at ON live_locations(expires_at);
CREATE INDEX IF NOT EXISTS idx_two_factor_settings_user_id ON two_factor_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_active ON active_sessions(last_active);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_media_settings_user_id ON media_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_auto_delete_room_id ON chat_auto_delete(room_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_message_id ON message_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reports_status ON message_reports(status);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- Insert default rooms with UUIDs
INSERT INTO rooms (id, name, description, type) VALUES
  (gen_random_uuid(), 'General', 'General discussion', 'public'),
  (gen_random_uuid(), 'Tech Talk', 'Technology and programming', 'public'),
  (gen_random_uuid(), 'Random', 'Off-topic conversations', 'public')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- For development: disable RLS temporarily to test
-- ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create messages" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read reactions" ON message_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reactions" ON message_reactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create group members" ON group_members FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read status updates" ON status_updates FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create status updates" ON status_updates FOR INSERT WITH CHECK (true);

-- Feature Policies
CREATE POLICY "Anyone can read pinned messages" ON pinned_messages FOR SELECT USING (true);
CREATE POLICY "Users can pin/unpin messages" ON pinned_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unpin messages" ON pinned_messages FOR DELETE USING (true);

CREATE POLICY "Users can manage their blocks" ON user_blocks FOR SELECT USING (blocker_id = current_user_id());
CREATE POLICY "Users can block others" ON user_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unblock" ON user_blocks FOR DELETE USING (true);

CREATE POLICY "Users can read own notification settings" ON notification_settings FOR SELECT USING (user_id = current_user_id());
CREATE POLICY "Users can update own notification settings" ON notification_settings FOR UPDATE USING (user_id = current_user_id());
CREATE POLICY "Users can create own notification settings" ON notification_settings FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id = current_user_id());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = current_user_id());

CREATE POLICY "Anyone can read analytics" ON analytics_snapshots FOR SELECT USING (true);
CREATE POLICY "System can write analytics" ON analytics_snapshots FOR INSERT WITH CHECK (true);
