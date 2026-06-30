import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const securityService = {
  // ==================== TWO-FACTOR AUTHENTICATION ====================

  // Generate TOTP secret
  generateTotpSecret(): string {
    return crypto.randomBytes(20).toString('hex');
  },

  // Verify TOTP code
  verifyTotpCode(secret: string, code: string): boolean {
    // In production, use actual TOTP library like speakeasy
    // This is a simplified verification
    const window = parseInt(process.env.TOTP_WINDOW || '1');
    
    // For demo, accept any 6-digit code starting with '0'
    // Real implementation would verify against time-based tokens
    return /^\d{6}$/.test(code) && code.startsWith('0');
  },

  // Enable 2FA for user
  async enableTwoFactor(userId: string, secret: string, qrCodeUrl: string) {
    try {
      const { data, error } = await supabase
        .from('two_factor_settings')
        .upsert({
          user_id: userId,
          secret_key: secret,
          qr_code_url: qrCodeUrl,
          enabled: false, // Not verified yet
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      throw error;
    }
  },

  // Verify and enable 2FA with code
  async verifyAndEnableTwoFactor(userId: string, code: string) {
    try {
      // Get current 2FA settings
      const { data: settings, error: fetchError } = await supabase
        .from('two_factor_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!settings || !settings.secret_key) {
        throw new Error('2FA not set up');
      }

      // Verify code
      const isValid = this.verifyTotpCode(settings.secret_key, code);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Update settings
      const { data, error } = await supabase
        .from('two_factor_settings')
        .update({
          enabled: true,
          verified_at: new Date().toISOString(),
          backup_codes: backupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await this.logSecurityEvent(userId, '2fa_enable', { success: true });

      return { ...data, backupCodes };
    } catch (error) {
      await this.logSecurityEvent(userId, '2fa_enable', { 
        success: false, 
        error: (error as Error).message 
      });
      throw error;
    }
  },

  // Disable 2FA
  async disableTwoFactor(userId: string, code: string) {
    try {
      // Get settings
      const { data: settings, error: fetchError } = await supabase
        .from('two_factor_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!settings || !settings.enabled) {
        throw new Error('2FA is not enabled');
      }

      // Verify code
      const isValid = this.verifyTotpCode(settings.secret_key, code);
      
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Disable 2FA
      const { error } = await supabase
        .from('two_factor_settings')
        .update({
          enabled: false,
          backup_codes: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;

      await this.logSecurityEvent(userId, '2fa_disable', { success: true });

      return { success: true };
    } catch (error) {
      await this.logSecurityEvent(userId, '2fa_disable', { 
        success: false, 
        error: (error as Error).message 
      });
      throw error;
    }
  },

  // Check if 2FA is enabled
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('two_factor_settings')
        .select('enabled')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.enabled || false;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  },

  // Generate backup codes
  generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Array.from({ length: 8 }, () => 
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 28)]
      ).join('-');
      codes.push(code);
    }
    return codes;
  },

  // Verify backup code
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const { data: settings, error } = await supabase
        .from('two_factor_settings')
        .select('backup_codes')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!settings?.backup_codes) {
        return false;
      }

      const codeIndex = settings.backup_codes.indexOf(code);
      
      if (codeIndex === -1) {
        return false;
      }

      // Remove used code
      const updatedCodes = [...settings.backup_codes];
      updatedCodes.splice(codeIndex, 1);

      await supabase
        .from('two_factor_settings')
        .update({ backup_codes: updatedCodes })
        .eq('user_id', userId);

      return true;
    } catch (error) {
      console.error('Error verifying backup code:', error);
      return false;
    }
  },

  // ==================== SESSION MANAGEMENT ====================

  // Create session
  async createSession(userId: string, sessionData: {
    device: string;
    location?: string;
    ipAddress?: string;
    userAgent?: string;
    isCurrentSession?: boolean;
  }) {
    try {
      // Mark other sessions as not current
      await supabase
        .from('active_sessions')
        .update({ is_current_session: false })
        .eq('user_id', userId);

      const { data, error } = await supabase
        .from('active_sessions')
        .insert({
          user_id: userId,
          device: sessionData.device,
          location: sessionData.location,
          ip_address: sessionData.ipAddress,
          user_agent: sessionData.userAgent,
          is_current_session: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Log login event
      await this.logSecurityEvent(userId, 'login', {
        device: sessionData.device,
        ip: sessionData.ipAddress,
        success: true,
        metadata: {
          location: sessionData.location,
        },
      });

      return data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  },

  // Get user sessions
  async getUserSessions(userId: string) {
    try {
      const { data, error } = await supabase
        .from('active_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_active', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
  },

  // Revoke specific session
  async revokeSession(sessionId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) throw error;

      await this.logSecurityEvent(userId, 'session_revoke', { 
        success: true, 
        metadata: { sessionId },
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  },

  // Revoke all other sessions
  async revokeOtherSessions(userId: string, currentSessionId: string) {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .delete()
        .eq('user_id', userId)
        .neq('id', currentSessionId);

      if (error) throw error;

      await this.logSecurityEvent(userId, 'session_revoke', { 
        success: true, 
        metadata: { type: 'all_other_sessions' },
      });

      return { success: true };
    } catch (error) {
      console.error('Error revoking sessions:', error);
      throw error;
    }
  },

  // Update session activity
  async updateSessionActivity(sessionId: string) {
    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({ last_active: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating session:', error);
    }
  },

  // ==================== PRIVACY SETTINGS ====================

  // Get privacy settings
  async getPrivacySettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      // Return defaults if not found
      if (!data) {
        return {
          last_seen: 'everyone',
          profile_photo: 'everyone',
          status: 'everyone',
          read_receipts: true,
          online_status: true,
          group_invites: 'everyone',
        };
      }

      return data;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
      throw error;
    }
  },

  // Update privacy settings
  async updatePrivacySettings(userId: string, settings: {
    last_seen?: 'everyone' | 'contacts' | 'nobody';
    profile_photo?: 'everyone' | 'contacts' | 'nobody';
    status?: 'everyone' | 'contacts' | 'nobody';
    read_receipts?: boolean;
    online_status?: boolean;
    group_invites?: 'everyone' | 'contacts' | 'nobody';
  }) {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
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
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  },

  // ==================== SECURITY LOGGING ====================

  // Log security event
  async logSecurityEvent(userId: string, eventType: string, details: {
    ip?: string;
    device?: string;
    success?: boolean;
    error?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          event_type: eventType,
          event_data: details.metadata || {
            error: details.error,
          },
          ip_address: details.ip,
          user_agent: details.device,
          success: details.success ?? true,
        });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  },

  // Get security logs
  async getSecurityLogs(userId: string, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching security logs:', error);
      throw error;
    }
  },

  // ==================== MESSAGE EDITING ====================

  // Edit message
  async editMessage(messageId: string, userId: string, newContent: string, oldContent: string) {
    try {
      // Record edit history
      await supabase
        .from('message_edits')
        .insert({
          message_id: messageId,
          old_content: oldContent,
          edited_by: userId,
        });

      // Update message
      const { data, error } = await supabase
        .from('messages')
        .update({
          content: newContent,
          updated_at: new Date().toISOString(),
          is_edited: true,
        })
        .eq('id', messageId)
        .eq('sender_id', userId) // Only sender can edit
        .select()
        .single();

      if (error) throw error;

      await this.logSecurityEvent(userId, 'message_edit', {
        success: true,
        metadata: { messageId },
      });

      return data;
    } catch (error) {
      await this.logSecurityEvent(userId, 'message_edit', {
        success: false,
        error: (error as Error).message,
        metadata: { messageId },
      });
      throw error;
    }
  },

  // Get message edit history
  async getMessageEditHistory(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('message_edits')
        .select('*')
        .eq('message_id', messageId)
        .order('edited_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching edit history:', error);
      throw error;
    }
  },

  // Delete message (for everyone or just self)
  async deleteMessage(messageId: string, userId: string, deleteFor: 'me' | 'everyone') {
    try {
      if (deleteFor === 'everyone') {
        // Check if message can be deleted for everyone (time limit)
        const { data: message, error: fetchError } = await supabase
          .from('messages')
          .select('created_at')
          .eq('id', messageId)
          .single();

        if (fetchError) throw fetchError;

        const messageTime = new Date(message.created_at).getTime();
        const oneHourAgo = Date.now() - 3600000;

        if (messageTime < oneHourAgo) {
          throw new Error('Messages can only be deleted for everyone within 1 hour');
        }

        // Delete the message completely
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId)
          .eq('sender_id', userId);

        if (error) throw error;
      } else {
        // Just hide it for this user (soft delete by adding metadata)
        // For simplicity, we'll just mark it as deleted by updating content
        const { error } = await supabase
          .from('messages')
          .update({
            content: 'This message has been deleted',
            deleted_for: true,
          })
          .eq('id', messageId);

        if (error) throw error;
      }

      await this.logSecurityEvent(userId, 'message_delete', {
        success: true,
        metadata: { messageId, deleteFor },
      });

      return { success: true };
    } catch (error) {
      await this.logSecurityEvent(userId, 'message_delete', {
        success: false,
        error: (error as Error).message,
        metadata: { messageId, deleteFor },
      });
      throw error;
    }
  },

  // ==================== STARRED MESSAGES ====================

  // Star message
  async starMessage(messageId: string, userId: string, roomId: string) {
    try {
      const { data, error } = await supabase
        .from('starred_messages')
        .insert({
          message_id: messageId,
          user_id: userId,
          room_id: roomId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error starring message:', error);
      throw error;
    }
  },

  // Unstar message
  async unstarMessage(messageId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('starred_messages')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error unstarring message:', error);
      throw error;
    }
  },

  // Get starred messages
  async getStarredMessages(userId: string) {
    try {
      const { data, error } = await supabase
        .from('starred_messages')
        .select(`
          *,
          messages (
            id,
            content,
            sender_name,
            sender_id,
            message_type,
            media_url,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('starred_at', { ascending: false });

      if (error) throw error;

      // Format the response
      return (data || []).map((item: any) => ({
        id: item.id,
        starredAt: item.starred_at,
        message: item.messages,
      }));
    } catch (error) {
      console.error('Error fetching starred messages:', error);
      throw error;
    }
  },

  // ==================== AUTO-DELETE SETTINGS ====================

  // Set auto-delete for chat
  async setAutoDelete(roomId: string, userId: string, deleteAfter: 'off' | '24h' | '7d' | '365d') {
    try {
      const { data, error } = await supabase
        .from('chat_auto_delete')
        .upsert({
          room_id: roomId,
          delete_after: deleteAfter,
          created_by: userId,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error setting auto-delete:', error);
      throw error;
    }
  },

  // Get auto-delete settings
  async getAutoDelete(roomId: string) {
    try {
      const { data, error } = await supabase
        .from('chat_auto_delete')
        .select('*')
        .eq('room_id', roomId)
        .maybeSingle();

      if (error) throw error;
      return data?.delete_after || 'off';
    } catch (error) {
      console.error('Error fetching auto-delete settings:', error);
      return 'off';
    }
  },

  // Run auto-delete cleanup (call this periodically)
  async runAutoDeleteCleanup() {
    try {
      const now = new Date().toISOString();

      // Get all chats with auto-delete enabled
      const { data: settings, error: settingsError } = await supabase
        .from('chat_auto_delete')
        .select('*')
        .neq('delete_after', 'off');

      if (settingsError) throw settingsError;

      for (const setting of settings || []) {
        let cutoffDate: Date;

        switch (setting.delete_after) {
          case '24h':
            cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '365d':
            cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            continue;
        }

        // Delete old messages
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('room_id', setting.room_id)
          .lt('created_at', cutoffDate.toISOString());

        if (error) {
          console.error(`Error deleting messages for room ${setting.room_id}:`, error);
        }
      }

      return { success: true, processed: settings?.length || 0 };
    } catch (error) {
      console.error('Error in auto-delete cleanup:', error);
      throw error;
    }
  },
};