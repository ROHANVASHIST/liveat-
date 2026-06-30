import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const broadcastService = {
  // Create a new broadcast list
  async createBroadcast(name: string, createdBy: string, recipientIds: string[]) {
    try {
      // Create the broadcast list
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcast_lists')
        .insert({ name, created_by: createdBy })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Add recipients
      const recipientData = recipientIds.map(recipientId => ({
        broadcast_id: broadcast.id,
        recipient_id: recipientId,
      }));

      const { error: recipientError } = await supabase
        .from('broadcast_recipients')
        .insert(recipientData);

      if (recipientError) throw recipientError;

      return broadcast;
    } catch (error) {
      console.error('Error creating broadcast:', error);
      throw error;
    }
  },

  // Get all broadcasts for a user
  async getUserBroadcasts(userId: string) {
    try {
      const { data: broadcasts, error } = await supabase
        .from('broadcast_lists')
        .select(`
          *,
          broadcast_recipients (
            recipient_id
          )
        `)
        .eq('created_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return broadcasts || [];
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      throw error;
    }
  },

  // Get broadcast details
  async getBroadcastDetails(broadcastId: string) {
    try {
      const { data: broadcast, error } = await supabase
        .from('broadcast_lists')
        .select(`
          *,
          broadcast_recipients (
            id,
            recipient_id,
            added_at
          )
        `)
        .eq('id', broadcastId)
        .single();

      if (error) throw error;

      // Get recipient details
      const recipientIds = broadcast.broadcast_recipients.map((r: any) => r.recipient_id);
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar, status')
        .in('id', recipientIds);

      if (usersError) throw usersError;

      // Combine recipient data with user details
      const recipientsWithDetails = broadcast.broadcast_recipients.map((r: any) => {
        const userDetails = users?.find((u: any) => u.id === r.recipient_id);
        return {
          ...r,
          user: userDetails,
        };
      });

      return {
        ...broadcast,
        recipients: recipientsWithDetails,
      };
    } catch (error) {
      console.error('Error fetching broadcast details:', error);
      throw error;
    }
  },

  // Update broadcast name
  async updateBroadcastName(broadcastId: string, name: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('broadcast_lists')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', broadcastId)
        .eq('created_by', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating broadcast:', error);
      throw error;
    }
  },

  // Add recipient to broadcast
  async addRecipient(broadcastId: string, recipientId: string) {
    try {
      const { data, error } = await supabase
        .from('broadcast_recipients')
        .insert({
          broadcast_id: broadcastId,
          recipient_id: recipientId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding recipient:', error);
      throw error;
    }
  },

  // Remove recipient from broadcast
  async removeRecipient(broadcastId: string, recipientId: string) {
    try {
      const { error } = await supabase
        .from('broadcast_recipients')
        .delete()
        .eq('broadcast_id', broadcastId)
        .eq('recipient_id', recipientId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing recipient:', error);
      throw error;
    }
  },

  // Delete broadcast
  async deleteBroadcast(broadcastId: string, userId: string) {
    try {
      // First delete recipients
      await supabase
        .from('broadcast_recipients')
        .delete()
        .eq('broadcast_id', broadcastId);

      // Then delete broadcast
      const { error } = await supabase
        .from('broadcast_lists')
        .delete()
        .eq('id', broadcastId)
        .eq('created_by', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      throw error;
    }
  },

  // Send broadcast message (creates individual messages for each recipient)
  async sendBroadcastMessage(
    broadcastId: string,
    senderId: string,
    senderName: string,
    content: string,
    roomId: string // In a real app, this would create a separate message per recipient
  ) {
    try {
      // Get broadcast recipients
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcast_lists')
        .select('*')
        .eq('id', broadcastId)
        .single();

      if (broadcastError) throw broadcastError;

      // In a real implementation, you would:
      // 1. For each recipient, create a direct message room if not exists
      // 2. Send the message to each recipient's room
      // 3. Track delivery status per recipient

      // For now, we'll just track the broadcast send
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          sender_name: senderName,
          content: content,
          room_id: roomId,
          message_type: 'broadcast',
          metadata: {
            broadcast_id: broadcastId,
            recipient_count: broadcast.broadcast_recipients?.length || 0,
          }
        })
        .select()
        .single();

      if (messageError) throw messageError;

      return message;
    } catch (error) {
      console.error('Error sending broadcast:', error);
      throw error;
    }
  },

  // Share broadcast list
  async shareBroadcast(broadcastId: string, shareLink: string) {
    try {
      const { data, error } = await supabase
        .from('broadcast_lists')
        .update({
          share_link: shareLink,
          updated_at: new Date().toISOString(),
        })
        .eq('id', broadcastId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error sharing broadcast:', error);
      throw error;
    }
  },
};