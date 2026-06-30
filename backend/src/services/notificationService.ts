import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export type NotificationType =
  | 'message_mentioned'
  | 'message_replied'
  | 'room_activity'
  | 'user_joined'
  | 'reaction_added'
  | 'message_pinned';

export const notificationService = {
  /**
   * Get or create notification settings for a user
   */
  async getOrCreateSettings(userId: string) {
    try {
      let { data: settings, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (!settings) {
        const { data: newSettings, error: createError } = await supabase
          .from('notification_settings')
          .insert({ user_id: userId })
          .select()
          .single();

        if (createError) throw createError;
        settings = newSettings;
      }

      return settings;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  },

  /**
   * Update notification settings
   */
  async updateSettings(userId: string, updates: Partial<{
    sound_enabled: boolean;
    desktop_enabled: boolean;
    email_enabled: boolean;
    mute_until: string;
    muted_rooms: string[];
  }>) {
    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  /**
   * Create a notification
   */
  async createNotification(notification: {
    user_id: string;
    type: NotificationType;
    actor_id?: string;
    actor_name?: string;
    room_id?: string;
    message_id?: string;
    title?: string;
    content?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Get unread notifications for a user
   */
  async getUnreadNotifications(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
      throw error;
    }
  },

  /**
   * Get all notifications for a user
   */
  async getAllNotifications(userId: string, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all notifications:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Check if user is currently muted
   */
  async isUserMuted(userId: string) {
    try {
      const settings = await this.getOrCreateSettings(userId);
      if (!settings.mute_until) return false;

      return new Date(settings.mute_until) > new Date();
    } catch (error) {
      console.error('Error checking if user is muted:', error);
      return false;
    }
  },

  /**
   * Check if room is muted for user
   */
  async isRoomMuted(userId: string, roomId: string) {
    try {
      const settings = await this.getOrCreateSettings(userId);
      return settings.muted_rooms && settings.muted_rooms.includes(roomId);
    } catch (error) {
      console.error('Error checking if room is muted:', error);
      return false;
    }
  },
};
