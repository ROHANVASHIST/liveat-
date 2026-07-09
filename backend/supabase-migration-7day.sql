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

-- 5. Storage policies: Create these in Supabase Dashboard > Storage > Policies
--    - Go to Storage > chat-media bucket > Policies
--    - Add policy: "Allow public uploads" with INSERT for authenticated users
--    - Add policy: "Allow public reads" with SELECT for public
--    - Add policy: "Allow service deletes" with DELETE for authenticated users

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
