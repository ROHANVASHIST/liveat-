import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const voiceLocationService = {
  // ==================== VOICE MESSAGES ====================

  // Save voice message
  async saveVoiceMessage(messageId: string, userId: string, voiceData: {
    duration: number;
    audioUrl: string;
    audioPath?: string;
    waveformData?: number[];
  }) {
    try {
      const { data, error } = await supabase
        .from('voice_messages')
        .insert({
          message_id: messageId,
          user_id: userId,
          duration: voiceData.duration,
          audio_url: voiceData.audioUrl,
          audio_path: voiceData.audioPath,
          waveform_data: voiceData.waveformData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving voice message:', error);
      throw error;
    }
  },

  // Get voice message for a message
  async getVoiceMessage(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('voice_messages')
        .select('*')
        .eq('message_id', messageId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching voice message:', error);
      throw error;
    }
  },

  // ==================== LIVE LOCATION ====================

  // Start sharing live location
  async startLiveLocation(userId: string, roomId: string, locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) {
    try {
      // Check if user already has an active live location in this room
      const { data: existing, error: existingError } = await supabase
        .from('live_locations')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', roomId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing) {
        // Update existing location
        const { data, error } = await supabase
          .from('live_locations')
          .update({
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            accuracy: locationData.accuracy,
            expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new live location
      const { data, error } = await supabase
        .from('live_locations')
        .insert({
          user_id: userId,
          room_id: roomId,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starting live location:', error);
      throw error;
    }
  },

  // Update live location
  async updateLiveLocation(locationId: string, locationData: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) {
    try {
      const { data, error } = await supabase
        .from('live_locations')
        .update({
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          updated_at: new Date().toISOString(),
        })
        .eq('id', locationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating live location:', error);
      throw error;
    }
  },

  // Stop sharing live location
  async stopLiveLocation(userId: string, roomId: string) {
    try {
      const { error } = await supabase
        .from('live_locations')
        .delete()
        .eq('user_id', userId)
        .eq('room_id', roomId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error stopping live location:', error);
      throw error;
    }
  },

  // Get active live locations in a room
  async getActiveLocations(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('live_locations')
        .select(`
          *,
          users (
            id,
            name,
            avatar
          )
        `)
        .eq('room_id', roomId)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the response with user details
      return (data || []).map((location: any) => ({
        ...location,
        user: location.users,
      }));
    } catch (error) {
      console.error('Error fetching live locations:', error);
      throw error;
    }
  },

  // Get user's active live location
  async getUserActiveLocation(userId: string, roomId: string) {
    try {
      const { data, error } = await supabase
        .from('live_locations')
        .select('*')
        .eq('user_id', userId)
        .eq('room_id', roomId)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user location:', error);
      throw error;
    }
  },

  // Cleanup expired locations (call periodically)
  async cleanupExpiredLocations() {
    try {
      const { error } = await supabase
        .from('live_locations')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up locations:', error);
      throw error;
    }
  },

  // ==================== MESSAGE FORWARDING ====================

  // Track forwarded message
  async trackForward(originalMessageId: string, forwardedBy: string) {
    try {
      // Check if already tracked
      const { data: existing, error: checkError } = await supabase
        .from('forwarded_messages')
        .select('*')
        .eq('original_message_id', originalMessageId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        // Increment forward count
        const { data, error } = await supabase
          .from('forwarded_messages')
          .update({
            forward_count: existing.forward_count + 1,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Create new tracking record
      const { data, error } = await supabase
        .from('forwarded_messages')
        .insert({
          original_message_id: originalMessageId,
          forwarded_by: forwardedBy,
          forward_count: 1,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error tracking forward:', error);
      throw error;
    }
  },

  // Get forward count
  async getForwardCount(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('forwarded_messages')
        .select('forward_count')
        .eq('original_message_id', messageId)
        .maybeSingle();

      if (error) throw error;
      return data?.forward_count || 0;
    } catch (error) {
      console.error('Error getting forward count:', error);
      return 0;
    }
  },

  // ==================== MESSAGE REPORTS ====================

  // Report message
  async reportMessage(messageId: string, reportedBy: string, reportData: {
    reason: string;
    description?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('message_reports')
        .insert({
          message_id: messageId,
          reported_by: reportedBy,
          reason: reportData.reason,
          description: reportData.description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error reporting message:', error);
      throw error;
    }
  },

  // Get pending reports (admin only)
  async getPendingReports() {
    try {
      const { data, error } = await supabase
        .from('message_reports')
        .select(`
          *,
          messages (
            id,
            content,
            sender_id,
            sender_name,
            room_id
          ),
          users:reported_by (
            id,
            name,
            avatar
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format response
      return (data || []).map((report: any) => ({
        ...report,
        message: report.messages,
        reporter: report.users,
      }));
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  },

  // Update report status (admin only)
  async updateReportStatus(reportId: string, status: 'reviewed' | 'dismissed' | 'action_taken', reviewedBy: string) {
    try {
      const { data, error } = await supabase
        .from('message_reports')
        .update({
          status,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', reportId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  },

  // ==================== MEDIA SETTINGS ====================

  // Get media settings
  async getMediaSettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('media_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // Return defaults if not found
      if (!data) {
        return {
          image_quality: 'auto',
          video_quality: 'auto',
          voice_message_quality: 'standard',
          auto_download_wifi: true,
          auto_download_cellular: false,
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching media settings:', error);
      throw error;
    }
  },

  // Update media settings
  async updateMediaSettings(userId: string, settings: {
    image_quality?: 'low' | 'medium' | 'high' | 'auto';
    video_quality?: 'low' | 'medium' | 'high' | 'auto';
    voice_message_quality?: 'standard' | 'high';
    auto_download_wifi?: boolean;
    auto_download_cellular?: boolean;
  }) {
    try {
      const { data, error } = await supabase
        .from('media_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating media settings:', error);
      throw error;
    }
  },

  // ==================== AUTO-DELETE CLEANUP ====================

  // Cleanup old messages based on room settings
  async cleanupOldMessages() {
    try {
      // Get all rooms with auto-delete enabled
      const { data: settings, error: settingsError } = await supabase
        .from('chat_auto_delete')
        .select('*')
        .neq('delete_after', 'off');

      if (settingsError) throw settingsError;

      const now = Date.now();
      let totalDeleted = 0;

      for (const setting of settings || []) {
        let cutoffTime: number;

        switch (setting.delete_after) {
          case '24h':
            cutoffTime = now - 24 * 60 * 60 * 1000;
            break;
          case '7d':
            cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
            break;
          case '365d':
            cutoffTime = now - 365 * 24 * 60 * 60 * 1000;
            break;
          default:
            continue;
        }

        const cutoffDate = new Date(cutoffTime).toISOString();

        // Delete old messages
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('room_id', setting.room_id)
          .lt('created_at', cutoffDate);

        if (error) {
          console.error(`Error deleting messages for room ${setting.room_id}:`, error);
        } else {
          totalDeleted++;
        }
      }

      return { success: true, roomsProcessed: totalDeleted };
    } catch (error) {
      console.error('Error in message cleanup:', error);
      throw error;
    }
  },
};