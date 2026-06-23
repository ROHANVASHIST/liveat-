import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const pinService = {
  /**
   * Pin a message in a room
   */
  async pinMessage(messageId: string, roomId: string, pinnedBy: string) {
    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .upsert(
          {
            message_id: messageId,
            room_id: roomId,
            pinned_by: pinnedBy,
          },
          { onConflict: 'message_id,room_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error pinning message:', error);
      throw error;
    }
  },

  /**
   * Unpin a message from a room
   */
  async unpinMessage(messageId: string, roomId: string) {
    try {
      const { error } = await supabase
        .from('pinned_messages')
        .delete()
        .eq('message_id', messageId)
        .eq('room_id', roomId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unpinning message:', error);
      throw error;
    }
  },

  /**
   * Get pinned messages for a room
   */
  async getPinnedMessages(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select('*, messages(*)')
        .eq('room_id', roomId)
        .order('pinned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      throw error;
    }
  },

  /**
   * Check if message is pinned
   */
  async isMessagePinned(messageId: string, roomId: string) {
    try {
      const { data, error } = await supabase
        .from('pinned_messages')
        .select('id')
        .eq('message_id', messageId)
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking if message is pinned:', error);
      return false;
    }
  },
};
