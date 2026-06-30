import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL 
  ? (import.meta.env.VITE_BACKEND_URL.startsWith('http') ? import.meta.env.VITE_BACKEND_URL : `https://${import.meta.env.VITE_BACKEND_URL}`)
  : '';

/**
 * Hook for message search functionality
 */
export const useMessageSearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);

  const search = useCallback(async (query: string, roomId?: string, senderId?: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams();
      params.append('query', query);
      if (roomId) params.append('roomId', roomId);
      if (senderId) params.append('senderId', senderId);

      const response = await fetch(`${API_BASE_URL}/api/messages/search?${params}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error: any) {
      setSearchError(error.message);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { isSearching, searchResults, searchError, search };
};

/**
 * Hook for message pinning
 */
export const useMessagePin = () => {
  const [isPinning, setIsPinning] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<any[]>([]);

  const pinMessage = useCallback(async (messageId: string, roomId: string) => {
    setIsPinning(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/pin`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) throw new Error('Failed to pin message');
      return await response.json();
    } finally {
      setIsPinning(false);
    }
  }, []);

  const unpinMessage = useCallback(async (messageId: string, roomId: string) => {
    setIsPinning(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/pin`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) throw new Error('Failed to unpin message');
      return await response.json();
    } finally {
      setIsPinning(false);
    }
  }, []);

  const fetchPinnedMessages = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/pinned-messages`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch pinned messages');
      const data = await response.json();
      setPinnedMessages(data);
      return data;
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      return [];
    }
  }, []);

  return { isPinning, pinnedMessages, pinMessage, unpinMessage, fetchPinnedMessages };
};

/**
 * Hook for user blocking
 */
export const useUserBlock = () => {
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [isBlocking, setIsBlocking] = useState(false);

  const blockUser = useCallback(async (userId: string, reason?: string) => {
    setIsBlocking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/block`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) throw new Error('Failed to block user');
      return await response.json();
    } finally {
      setIsBlocking(false);
    }
  }, []);

  const unblockUser = useCallback(async (userId: string) => {
    setIsBlocking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/block`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to unblock user');
      return await response.json();
    } finally {
      setIsBlocking(false);
    }
  }, []);

  const fetchBlockedUsers = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/blocked`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch blocked users');
      const data = await response.json();
      setBlockedUsers(data);
      return data;
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      return [];
    }
  }, []);

  return { blockedUsers, isBlocking, blockUser, unblockUser, fetchBlockedUsers };
};

/**
 * Hook for notifications
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/notifications?unread=${unreadOnly}`,
        { credentials: 'include' }
      );

      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data);
      const unread = data.filter((n: any) => !n.read_at).length;
      setUnreadCount(unread);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to mark notification as read');
      await fetchNotifications();
      return await response.json();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchNotifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to mark all notifications as read');
      setUnreadCount(0);
      return await response.json();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      return await response.json();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};

/**
 * Hook for notification settings
 */
export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/settings`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch notification settings');
      const data = await response.json();
      setSettings(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (updates: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update notification settings');
      const data = await response.json();
      setSettings(data);
      return data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  }, []);

  return { settings, isLoading, fetchSettings, updateSettings };
};

/**
 * Hook for analytics data
 */
export const useAnalytics = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDashboardMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setMetrics(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchEngagementMetrics = useCallback(async (period = '7d') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/engagement?period=${period}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch engagement metrics');
      const data = await response.json();
      setEngagement(data);
      return data;
    } catch (error) {
      console.error('Error fetching engagement metrics:', error);
    }
  }, []);

  const fetchRoomMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/rooms`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch room metrics');
      const data = await response.json();
      setRooms(data);
      return data;
    } catch (error) {
      console.error('Error fetching room metrics:', error);
    }
  }, []);

  const fetchActivityHeatmap = useCallback(async (period = '7d') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/heatmap?period=${period}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch activity heatmap');
      const data = await response.json();
      setHeatmap(data);
      return data;
    } catch (error) {
      console.error('Error fetching activity heatmap:', error);
    }
  }, []);

  return {
    metrics,
    engagement,
    rooms,
    heatmap,
    isLoading,
    fetchDashboardMetrics,
    fetchEngagementMetrics,
    fetchRoomMetrics,
    fetchActivityHeatmap,
  };
};
/**
 * Hook for broadcast lists
 */
export const useBroadcast = () => {
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createBroadcast = useCallback(async (name: string, recipientIds: string[]) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcasts`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, recipientIds }),
      });

      if (!response.ok) throw new Error('Failed to create broadcast');
      const broadcast = await response.json();
      setBroadcasts((prev) => [broadcast, ...prev]);
      return broadcast;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBroadcasts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcasts`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch broadcasts');
      const data = await response.json();
      setBroadcasts(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteBroadcast = useCallback(async (broadcastId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcasts/${broadcastId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to delete broadcast');
      setBroadcasts((prev) => prev.filter((b) => b.id !== broadcastId));
      return await response.json();
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      throw error;
    }
  }, []);

  const sendBroadcast = useCallback(async (broadcastId: string, content: string, roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/broadcasts/${broadcastId}/send`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, roomId }),
      });

      if (!response.ok) throw new Error('Failed to send broadcast');
      return await response.json();
    } catch (error) {
      console.error('Error sending broadcast:', error);
      throw error;
    }
  }, []);

  return { broadcasts, isLoading, createBroadcast, fetchBroadcasts, deleteBroadcast, sendBroadcast };
};

/**
 * Hook for security features (2FA, sessions, privacy)
 */
export const useSecurity = () => {
  const [isLoading, setIsLoading] = useState(false);

  // 2FA
  const setup2FA = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/2fa/setup`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to setup 2FA');
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verify2FA = useCallback(async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/2fa/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error('Invalid verification code');
      return await response.json();
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      throw error;
    }
  }, []);

  const disable2FA = useCallback(async (code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/2fa/disable`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) throw new Error('Invalid verification code');
      return await response.json();
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      throw error;
    }
  }, []);

  const check2FAStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/2fa/status`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to check 2FA status');
      return await response.json();
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return { enabled: false };
    }
  }, []);

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/sessions`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch sessions');
      const data = await response.json();
      setSessions(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const revokeSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to revoke session');
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      return await response.json();
    } catch (error) {
      console.error('Error revoking session:', error);
      throw error;
    }
  }, []);

  const revokeOtherSessions = useCallback(async (currentSessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/sessions/revoke-others`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentSessionId }),
      });

      if (!response.ok) throw new Error('Failed to revoke other sessions');
      await fetchSessions();
      return await response.json();
    } catch (error) {
      console.error('Error revoking other sessions:', error);
      throw error;
    }
  }, [fetchSessions]);

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState<any>(null);

  const fetchPrivacySettings = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/privacy`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch privacy settings');
      const data = await response.json();
      setPrivacySettings(data);
      return data;
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    }
  }, []);

  const updatePrivacySettings = useCallback(async (settings: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/security/privacy`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Failed to update privacy settings');
      const data = await response.json();
      setPrivacySettings(data);
      return data;
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      throw error;
    }
  }, []);

  return {
    isLoading,
    setup2FA,
    verify2FA,
    disable2FA,
    check2FAStatus,
    sessions,
    fetchSessions,
    revokeSession,
    revokeOtherSessions,
    privacySettings,
    fetchPrivacySettings,
    updatePrivacySettings,
  };
};

/**
 * Hook for voice messages
 */
export const useVoiceMessages = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const saveVoiceMessage = useCallback(async (messageId: string, duration: number, audioUrl: string, waveformData?: number[]) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-messages`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, duration, audioUrl, waveformData }),
      });

      if (!response.ok) throw new Error('Failed to save voice message');
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVoiceMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/voice-messages/${messageId}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch voice message');
      return await response.json();
    } catch (error) {
      console.error('Error fetching voice message:', error);
      return null;
    }
  }, []);

  // Media recorder helper
  const startRecording = useCallback((onDataAvailable: (data: Blob) => void) => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
            onDataAvailable(e.data);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);

        return { mediaRecorder, chunks, stream };
      })
      .catch((error) => {
        console.error('Error accessing microphone:', error);
        throw error;
      });
  }, []);

  const stopRecording = useCallback((mediaRecorder: MediaRecorder, stream: MediaStream) => {
    return new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(mediaRecorder.chunks, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        resolve(blob);
      };
      mediaRecorder.stop();
    });
  }, []);

  return {
    isRecording,
    isLoading,
    saveVoiceMessage,
    fetchVoiceMessage,
    startRecording,
    stopRecording,
  };
};

/**
 * Hook for live location sharing
 */
export const useLiveLocation = () => {
  const [activeLocations, setActiveLocations] = useState<any[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startSharing = useCallback(async (roomId: string, latitude: number, longitude: number, accuracy?: number) => {
    setIsSharing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-location/start`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, latitude, longitude, accuracy }),
      });

      if (!response.ok) throw new Error('Failed to start location sharing');
      return await response.json();
    } catch (error) {
      setIsSharing(false);
      console.error('Error starting location sharing:', error);
      throw error;
    }
  }, []);

  const stopSharing = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-location/stop`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) throw new Error('Failed to stop location sharing');
      setIsSharing(false);
      return await response.json();
    } catch (error) {
      console.error('Error stopping location sharing:', error);
      throw error;
    }
  }, []);

  const fetchActiveLocations = useCallback(async (roomId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-location/${roomId}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch locations');
      const data = await response.json();
      setActiveLocations(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    activeLocations,
    isSharing,
    isLoading,
    startSharing,
    stopSharing,
    fetchActiveLocations,
  };
};

/**
 * Hook for starred messages
 */
export const useStarredMessages = () => {
  const [starredMessages, setStarredMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const starMessage = useCallback(async (messageId: string, roomId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/star`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) throw new Error('Failed to star message');
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unstarMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/star`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to unstar message');
      setStarredMessages((prev) => prev.filter((m) => m.message_id !== messageId));
      return await response.json();
    } catch (error) {
      console.error('Error unstarring message:', error);
      throw error;
    }
  }, []);

  const fetchStarredMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/starred`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch starred messages');
      const data = await response.json();
      setStarredMessages(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { starredMessages, isLoading, starMessage, unstarMessage, fetchStarredMessages };
};

/**
 * Hook for message editing and deletion
 */
export const useMessageEdit = () => {
  const [isLoading, setIsLoading] = useState(false);

  const editMessage = useCallback(async (messageId: string, content: string, oldContent: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, oldContent }),
      });

      if (!response.ok) throw new Error('Failed to edit message');
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string, deleteFor: 'me' | 'everyone') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteFor }),
      });

      if (!response.ok) throw new Error('Failed to delete message');
      return await response.json();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }, []);

  const getEditHistory = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/edits`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch edit history');
      return await response.json();
    } catch (error) {
      console.error('Error fetching edit history:', error);
      return [];
    }
  }, []);

  return { isLoading, editMessage, deleteMessage, getEditHistory };
};

/**
 * Hook for auto-delete settings
 */
export const useAutoDelete = () => {
  const [isLoading, setIsLoading] = useState(false);

  const getAutoDeleteSettings = useCallback(async (roomId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/auto-delete`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch auto-delete settings');
      const data = await response.json();
      return data.deleteAfter || 'off';
    } catch (error) {
      console.error('Error fetching auto-delete settings:', error);
      return 'off';
    }
  }, []);

  const setAutoDelete = useCallback(async (roomId: string, deleteAfter: 'off' | '24h' | '7d' | '365d') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${roomId}/auto-delete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAfter }),
      });

      if (!response.ok) throw new Error('Failed to set auto-delete');
      return await response.json();
    } catch (error) {
      console.error('Error setting auto-delete:', error);
      throw error;
    }
  }, []);

  return { isLoading, getAutoDeleteSettings, setAutoDelete };
};

/**
 * Hook for message forwarding
 */
export const useMessageForward = () => {
  const [isLoading, setIsLoading] = useState(false);

  const forwardMessage = useCallback(async (messageId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/forward`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to forward message');
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getForwardCount = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/forward-count`, {
        credentials: 'include',
      });

      if (!response.ok) return 0;
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      return 0;
    }
  }, []);

  return { isLoading, forwardMessage, getForwardCount };
};

/**
 * Hook for message reporting
 */
export const useMessageReport = () => {
  const [isLoading, setIsLoading] = useState(false);

  const reportMessage = useCallback(async (messageId: string, reason: string, description?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/${messageId}/report`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description }),
      });

      if (!response.ok) throw new Error('Failed to report message');
      return await response.json();
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, reportMessage };
};

/**
 * Hook for media settings
 */
export const useMediaSettings = () => {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMediaSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/media/settings`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch media settings');
      const data = await response.json();
      setSettings(data);
      return data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMediaSettings = useCallback(async (updates: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/media/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update media settings');
      const data = await response.json();
      setSettings(data);
      return data;
    } catch (error) {
      console.error('Error updating media settings:', error);
      throw error;
    }
  }, []);

  return { settings, isLoading, fetchMediaSettings, updateMediaSettings };
};