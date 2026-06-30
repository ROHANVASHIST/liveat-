import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export const analyticsService = {
  /**
   * Get overall dashboard metrics
   */
  async getDashboardMetrics() {
    try {
      const { count: totalMessages } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: totalRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true });

      // Get messages from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { count: messagesLast24h } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      return {
        totalMessages: totalMessages || 0,
        totalUsers: totalUsers || 0,
        totalRooms: totalRooms || 0,
        messagesLast24h: messagesLast24h || 0,
        avgMessageLength: 0, // Will calculate below
        peakHour: '14:00', // Example
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  },

  /**
   * Get engagement metrics
   */
  async getEngagementMetrics(period = '7d') {
    try {
      const startDate = new Date();
      const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
      startDate.setDate(startDate.getDate() - days);

      // Most active users
      const { data: activeUsers, error: userError } = await supabase
        .from('messages')
        .select('sender_id, sender_name')
        .gte('created_at', startDate.toISOString());

      if (userError) throw userError;

      const userActivity = (activeUsers || []).reduce(
        (acc: Record<string, number>, msg: any) => {
          acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
          return acc;
        },
        {}
      );

      const topUsers = Object.entries(userActivity)
        .map(([userId, count]) => ({ userId, messageCount: count }))
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 10);

      // Messages per day
      const { data: allMessages } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      const messagesPerDay: Record<string, number> = {};
      (allMessages || []).forEach((msg: any) => {
        const date = new Date(msg.created_at).toISOString().split('T')[0];
        messagesPerDay[date] = (messagesPerDay[date] || 0) + 1;
      });

      return {
        topUsers,
        messagesPerDay,
        period,
      };
    } catch (error) {
      console.error('Error getting engagement metrics:', error);
      throw error;
    }
  },

  /**
   * Get room performance metrics
   */
  async getRoomMetrics() {
    try {
      const { data: rooms, error: roomError } = await supabase
        .from('rooms')
        .select('id, name, description');

      if (roomError) throw roomError;

      const roomStats = await Promise.all(
        (rooms || []).map(async (room) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          const { count: memberCount } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id);

          return {
            roomId: room.id,
            roomName: room.name,
            messageCount: count || 0,
            memberCount: memberCount || 0,
          };
        })
      );

      return roomStats.sort((a, b) => b.messageCount - a.messageCount);
    } catch (error) {
      console.error('Error getting room metrics:', error);
      throw error;
    }
  },

  /**
   * Get activity heatmap (messages by hour of day)
   */
  async getActivityHeatmap(period = '7d') {
    try {
      const startDate = new Date();
      const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
      startDate.setDate(startDate.getDate() - days);

      const { data: messages, error } = await supabase
        .from('messages')
        .select('created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      const heatmap: Record<number, number> = {};
      for (let i = 0; i < 24; i++) {
        heatmap[i] = 0;
      }

      (messages || []).forEach((msg: any) => {
        const hour = new Date(msg.created_at).getHours();
        heatmap[hour]++;
      });

      return Object.entries(heatmap).map(([hour, count]) => ({
        hour: parseInt(hour),
        count,
      }));
    } catch (error) {
      console.error('Error getting activity heatmap:', error);
      throw error;
    }
  },

  /**
   * Get content type distribution
   */
  async getContentTypeDistribution() {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('message_type');

      if (error) throw error;

      const distribution = (messages || []).reduce(
        (acc: Record<string, number>, msg: any) => {
          const type = msg.message_type || 'text';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {}
      );

      return Object.entries(distribution).map(([type, count]) => ({
        type,
        count,
        percentage: ((count as number) / (messages?.length || 1) * 100).toFixed(2),
      }));
    } catch (error) {
      console.error('Error getting content type distribution:', error);
      throw error;
    }
  },

  /**
   * Record metric snapshot
   */
  async recordMetric(
    metricType: string,
    metricName: string,
    value: number,
    metadata?: Record<string, any>
  ) {
    try {
      const { error } = await supabase
        .from('analytics_snapshots')
        .insert({
          metric_type: metricType,
          metric_name: metricName,
          value,
          metadata: metadata || {},
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error recording metric:', error);
      throw error;
    }
  },

  /**
   * Get user retention cohort
   */
  async getUserRetention() {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('id, created_at, last_seen');

      if (error) throw error;

      const now = new Date();
      const retention = {
        dayOne: 0,
        dayFive: 0,
        dayThirty: 0,
        day90: 0,
      };

      (users || []).forEach((user: any) => {
        const createdAt = new Date(user.created_at);
        const daysSinceCreation = Math.floor(
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceCreation >= 1 && daysSinceCreation < 30) retention.dayOne++;
        if (daysSinceCreation >= 5 && daysSinceCreation < 30) retention.dayFive++;
        if (daysSinceCreation >= 30 && daysSinceCreation < 90) retention.dayThirty++;
        if (daysSinceCreation >= 90) retention.day90++;
      });

      return retention;
    } catch (error) {
      console.error('Error calculating user retention:', error);
      throw error;
    }
  },
};
