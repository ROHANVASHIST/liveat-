import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const blockService = {
  /**
   * Block a user
   */
  async blockUser(blockerId: string, blockedUserId: string, reason?: string) {
    try {
      if (blockerId === blockedUserId) {
        throw new Error('Cannot block yourself');
      }

      const { data, error } = await supabase
        .from('user_blocks')
        .upsert(
          {
            blocker_id: blockerId,
            blocked_user_id: blockedUserId,
            reason: reason || null,
          },
          { onConflict: 'blocker_id,blocked_user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error blocking user:', error);
      throw error;
    }
  },

  /**
   * Unblock a user
   */
  async unblockUser(blockerId: string, blockedUserId: string) {
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_user_id', blockedUserId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unblocking user:', error);
      throw error;
    }
  },

  /**
   * Get list of blocked users for a user
   */
  async getBlockedUsers(blockerId: string) {
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('*, blocked_user:blocked_user_id(id, name, avatar, email)')
        .eq('blocker_id', blockerId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      throw error;
    }
  },

  /**
   * Get list of users who have blocked this user
   */
  async getBlockedByUsers(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocker_id')
        .eq('blocked_user_id', userId);

      if (error) throw error;
      return (data || []).map((block: any) => block.blocker_id);
    } catch (error) {
      console.error('Error fetching blocked by users:', error);
      return [];
    }
  },

  /**
   * Check if user A has blocked user B
   */
  async isUserBlocked(blockerId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('id')
        .eq('blocker_id', blockerId)
        .eq('blocked_user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false;
    }
  },

  /**
   * Get all blocking relationships for a user (both directions)
   */
  async getUserBlockingRelationships(userId: string) {
    try {
      const { data: blocked, error: blockedError } = await supabase
        .from('user_blocks')
        .select('blocked_user_id')
        .eq('blocker_id', userId);

      const { data: blockedBy, error: blockedByError } = await supabase
        .from('user_blocks')
        .select('blocker_id')
        .eq('blocked_user_id', userId);

      if (blockedError || blockedByError) throw blockedError || blockedByError;

      return {
        blocked: (blocked || []).map((b: any) => b.blocked_user_id),
        blockedBy: (blockedBy || []).map((b: any) => b.blocker_id),
      };
    } catch (error) {
      console.error('Error fetching blocking relationships:', error);
      return { blocked: [], blockedBy: [] };
    }
  },
};
