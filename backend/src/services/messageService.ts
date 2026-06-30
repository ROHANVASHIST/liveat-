import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const messageService = {
  /**
   * Search messages by query string across content
   */
  async searchMessages(
    query: string,
    roomId?: string,
    senderId?: string,
    limit = 50,
    offset = 0
  ) {
    try {
      let queryBuilder = supabase
        .from('messages')
        .select('*')
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false });

      if (roomId) {
        queryBuilder = queryBuilder.eq('room_id', roomId);
      }

      if (senderId) {
        queryBuilder = queryBuilder.eq('sender_id', senderId);
      }

      const { data, count, error } = await queryBuilder
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { results: data || [], total: count || 0 };
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  },

  /**
   * Get messages for a room (paginated)
   */
  async getMessages(roomId: string, limit = 50, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  /**
   * Get message history for last N days
   */
  async getMessageHistory(roomId: string, daysBack = 7) {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - daysBack);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', roomId)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(500);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching message history:', error);
      throw error;
    }
  },

  /**
   * Save a new message to database
   */
  async saveMessage(messageData: {
    sender_id: string;
    sender_name: string;
    content: string;
    room_id: string;
    message_type?: string;
    media_url?: string;
    media_storage_path?: string;
  }) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...messageData,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  },

  /**
   * Get message with reactions included
   */
  async getMessageWithReactions(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, message_reactions(*)')
        .eq('id', messageId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching message with reactions:', error);
      throw error;
    }
  },
};
