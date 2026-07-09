-- ============================================
-- COMPLETE DATABASE SETUP
-- Drops all existing tables and recreates them
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS update_user_mfa_settings_updated_at ON user_mfa_settings;
DROP TRIGGER IF EXISTS update_failed_login_attempts_updated_at ON failed_login_attempts;

-- Drop all policies first
DO $$ DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Drop all tables in reverse dependency order (CASCADE handles FKs)
DROP TABLE IF EXISTS
  folder_rooms,
  poll_votes,
  bookmarks,
  device_sync,
  tasks,
  events,
  polls,
  chat_themes,
  custom_emojis,
  scheduled_messages,
  encryption_keys,
  message_read_receipts,
  chat_folders,
  failed_login_attempts,
  security_audit_log,
  user_sessions,
  passkey_challenges,
  user_authenticators,
  user_mfa_settings,
  forwarded_messages,
  starred_messages,
  voice_messages,
  message_edits,
  message_reports,
  message_reactions,
  broadcast_recipients,
  broadcast_lists,
  pinned_messages,
  user_blocks,
  notification_settings,
  notifications,
  analytics_snapshots,
  live_locations,
  two_factor_settings,
  active_sessions,
  privacy_settings,
  media_settings,
  chat_auto_delete,
  security_logs,
  status_updates,
  group_members,
  messages,
  rooms,
  users
CASCADE;

-- ============================================
-- CORE TABLES
-- ============================================

CREATE TABLE users (
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

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  room_id TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  media_url TEXT,
  media_storage_path TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  thumbnail_url TEXT,
  encrypted BOOLEAN DEFAULT false,
  encrypted_data JSONB,
  parent_message_id TEXT,
  reply_to_msg_id TEXT,
  status TEXT DEFAULT 'sent',
  is_edited BOOLEAN DEFAULT false,
  deleted_for BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role TEXT DEFAULT 'member'
);

CREATE TABLE status_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FEATURE TABLES
-- ============================================

CREATE TABLE voice_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  duration INTEGER NOT NULL,
  audio_url TEXT,
  audio_path TEXT,
  waveform_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE message_edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  old_content TEXT NOT NULL,
  edited_by TEXT NOT NULL,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE broadcast_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE broadcast_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id UUID REFERENCES broadcast_lists(id) ON DELETE CASCADE,
  recipient_id TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(broadcast_id, recipient_id)
);

CREATE TABLE starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  starred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE forwarded_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  forwarded_by TEXT NOT NULL,
  forward_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE live_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  room_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE two_factor_settings (
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

CREATE TABLE active_sessions (
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

CREATE TABLE privacy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  last_seen TEXT DEFAULT 'everyone',
  profile_photo TEXT DEFAULT 'everyone',
  status TEXT DEFAULT 'everyone',
  read_receipts BOOLEAN DEFAULT true,
  online_status BOOLEAN DEFAULT true,
  group_invites TEXT DEFAULT 'everyone',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE media_settings (
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

CREATE TABLE chat_auto_delete (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  delete_after TEXT DEFAULT 'off',
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id)
);

CREATE TABLE message_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reported_by TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  device_info TEXT,
  success BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  pinned_by TEXT NOT NULL,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id)
);

CREATE TABLE user_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id TEXT NOT NULL,
  blocked_user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_user_id)
);

CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  message_notifications BOOLEAN DEFAULT true,
  group_notifications BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  do_not_disturb BOOLEAN DEFAULT false,
  dnd_from TIME,
  dnd_to TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- FEATURES MIGRATION TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  private_key_encrypted TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  sender_name TEXT,
  content TEXT NOT NULL,
  room_id TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS custom_emojis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  url TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  colors JSONB NOT NULL,
  background_url TEXT,
  font_family TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS folder_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES chat_folders(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  multiple_choice BOOLEAN DEFAULT false,
  anonymous BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER,
  location TEXT,
  attendees JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, message_id)
);

CREATE TABLE IF NOT EXISTS device_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  data JSONB NOT NULL,
  last_synced TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available';

-- ============================================
-- SECURITY TABLES
-- ============================================

CREATE TABLE user_mfa_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  totp_secret TEXT,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  backup_codes TEXT[] DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE,
  disabled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE user_authenticators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  credential_public_key TEXT NOT NULL,
  counter BIGINT DEFAULT 0,
  transports TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  challenge TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('registration', 'authentication')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  ip_address TEXT NOT NULL,
  attempt_count INTEGER DEFAULT 1,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

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
CREATE INDEX IF NOT EXISTS idx_pinned_messages_room_id ON pinned_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_message_id ON pinned_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker_id ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_user_id ON user_blocks(blocked_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_metric_type ON analytics_snapshots(metric_type);
CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_created_at ON analytics_snapshots(created_at);
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
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_authenticators_user_id ON user_authenticators(user_id);
CREATE INDEX IF NOT EXISTS idx_user_authenticators_credential_id ON user_authenticators(credential_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_user_id ON passkey_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires_at ON passkey_challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_email ON failed_login_attempts(email);

-- ============================================
-- DEFAULT ROOMS
-- ============================================

INSERT INTO rooms (id, name, description, type) VALUES
  (gen_random_uuid(), 'General', 'General discussion', 'public'),
  (gen_random_uuid(), 'Tech Talk', 'Technology and programming', 'public'),
  (gen_random_uuid(), 'Random', 'Off-topic conversations', 'public')
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

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
ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_authenticators ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- For development: disable RLS temporarily to test
-- ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================

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

CREATE POLICY "Anyone can read pinned messages" ON pinned_messages FOR SELECT USING (true);
CREATE POLICY "Users can pin/unpin messages" ON pinned_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unpin messages" ON pinned_messages FOR DELETE USING (true);

CREATE POLICY "Users can manage their blocks" ON user_blocks FOR SELECT USING (blocker_id = auth.uid()::text);
CREATE POLICY "Users can block others" ON user_blocks FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can unblock" ON user_blocks FOR DELETE USING (true);

CREATE POLICY "Users can read own notification settings" ON notification_settings FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "Users can update own notification settings" ON notification_settings FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "Users can create own notification settings" ON notification_settings FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can read own notifications" ON notifications FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid()::text);

CREATE POLICY "Anyone can read analytics" ON analytics_snapshots FOR SELECT USING (true);
CREATE POLICY "System can write analytics" ON analytics_snapshots FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own MFA settings" ON user_mfa_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own MFA settings" ON user_mfa_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own authenticators" ON user_authenticators
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own authenticators" ON user_authenticators
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON user_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own audit logs" ON security_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  DELETE FROM messages WHERE expires_at < NOW();
  DELETE FROM status_updates WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void AS $$
BEGIN
  DELETE FROM passkey_challenges WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_data JSONB,
  p_ip_address TEXT,
  p_user_agent TEXT,
  p_success BOOLEAN
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO security_audit_log (user_id, event_type, event_data, ip_address, user_agent, success)
  VALUES (p_user_id, p_event_type, p_event_data, p_ip_address, p_user_agent, p_success)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_mfa_settings_updated_at
  BEFORE UPDATE ON user_mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_failed_login_attempts_updated_at
  BEFORE UPDATE ON failed_login_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON user_mfa_settings TO authenticated;
GRANT SELECT, INSERT, DELETE ON user_authenticators TO authenticated;
GRANT SELECT, INSERT, DELETE ON passkey_challenges TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_sessions TO authenticated;
GRANT SELECT, INSERT ON security_audit_log TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_mfa_settings IS 'Stores multi-factor authentication settings including TOTP secrets and backup codes';
COMMENT ON TABLE user_authenticators IS 'Stores WebAuthn/Passkey credentials for biometric authentication';
COMMENT ON TABLE passkey_challenges IS 'Temporary storage for WebAuthn challenges during registration and authentication';
COMMENT ON TABLE user_sessions IS 'Manages user sessions with JWT refresh tokens for secure token-based authentication';
COMMENT ON TABLE security_audit_log IS 'Comprehensive audit trail of all security-related events';
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for brute force protection';
