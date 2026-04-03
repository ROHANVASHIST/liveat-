-- ============================================
-- Migration: 7-Day Message Retention + Media Storage
-- Run this in your Supabase SQL Editor
-- ============================================

-- 1. Add expires_at column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE 
DEFAULT (NOW() + INTERVAL '7 days');

-- 2. Backfill existing messages with 7-day expiry from their creation time
UPDATE messages 
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

-- 3. Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_messages_expires_at ON messages(expires_at);

-- 4. Create a storage bucket for chat media (images, files)
-- Run this via the Supabase Dashboard > Storage > New Bucket
-- Bucket name: chat-media
-- Public: true (so users can view shared media)
-- File size limit: 10MB
-- Allowed MIME types: image/*, video/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.*

-- 5. Storage policies (run after creating the bucket in Dashboard)
-- Allow authenticated uploads
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'Allow public uploads', 'chat-media', 'INSERT', '(true)'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE name = 'Allow public uploads' AND bucket_id = 'chat-media'
);

-- Allow public reads
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'Allow public reads', 'chat-media', 'SELECT', '(true)'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE name = 'Allow public reads' AND bucket_id = 'chat-media'
);

-- Allow deletes (for cleanup)
INSERT INTO storage.policies (name, bucket_id, operation, definition)
SELECT 'Allow service deletes', 'chat-media', 'DELETE', '(true)'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.policies WHERE name = 'Allow service deletes' AND bucket_id = 'chat-media'
);

-- 6. Create a function to auto-delete expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_messages()
RETURNS void AS $$
BEGIN
  -- Delete expired messages (cascade will handle reactions)
  DELETE FROM messages WHERE expires_at < NOW();
  
  -- Delete expired status updates
  DELETE FROM status_updates WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Schedule the cleanup to run daily using pg_cron (if available)
-- Note: pg_cron must be enabled in your Supabase project
-- Go to Database > Extensions > Enable pg_cron
-- Then run:
-- SELECT cron.schedule('cleanup-expired-messages', '0 3 * * *', 'SELECT cleanup_expired_messages()');
