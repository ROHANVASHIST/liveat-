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
