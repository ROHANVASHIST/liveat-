import React, { useEffect, useState } from 'react';
import { useAnalytics } from '@/lib/hooks';
import { Activity, BarChart3, TrendingUp, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../dialog';
import { Button } from '../button';
import { ScrollArea } from '../scroll-area';
import { cn } from '@/lib/utils';

interface AdvancedAnalyticsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'engagement' | 'rooms' | 'activity'>(
    'overview'
  );
  const {
    metrics,
    engagement,
    rooms,
    heatmap,
    fetchDashboardMetrics,
    fetchEngagementMetrics,
    fetchRoomMetrics,
    fetchActivityHeatmap,
  } = useAnalytics();

  useEffect(() => {
    if (isOpen) {
      fetchDashboardMetrics();
      fetchEngagementMetrics();
      fetchRoomMetrics();
      fetchActivityHeatmap();
    }
  }, [isOpen, fetchDashboardMetrics, fetchEngagementMetrics, fetchRoomMetrics, fetchActivityHeatmap]);

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
    { id: 'engagement' as const, label: 'Engagement', icon: TrendingUp },
    { id: 'rooms' as const, label: 'Rooms', icon: Users },
    { id: 'activity' as const, label: 'Activity', icon: Activity },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Advanced Analytics
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border/50 p-4 -mt-2 mb-4">
          {tabs.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(id)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Button>
          ))}
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-4">
            {/* Overview Tab */}
            {activeTab === 'overview' && metrics && (
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Total Messages"
                  value={metrics.totalMessages}
                  icon="💬"
                />
                <MetricCard label="Total Users" value={metrics.totalUsers} icon="👥" />
                <MetricCard
                  label="Total Rooms"
                  value={metrics.totalRooms}
                  icon="🏠"
                />
                <MetricCard
                  label="Last 24h Messages"
                  value={metrics.messagesLast24h}
                  icon="⚡"
                />
              </div>
            )}

            {/* Engagement Tab */}
            {activeTab === 'engagement' && engagement && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm mb-3">Top Active Users</h3>
                  <div className="space-y-2">
                    {engagement.topUsers?.slice(0, 5).map((user: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                        <span className="text-sm">#{idx + 1} User Activity</span>
                        <span className="font-mono font-semibold text-primary">
                          {user.messageCount} msgs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-3">Messages Per Day</h3>
                  <div className="space-y-2">
                    {Object.entries(engagement.messagesPerDay)
                      ?.slice(-7)
                      .map(([date, count]: [string, any]) => (
                        <div key={date} className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{date}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2 bg-primary rounded"
                              style={{ width: `${Math.max(count * 2, 10)}px` }}
                            />
                            <span className="text-xs font-semibold">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Rooms Tab */}
            {activeTab === 'rooms' && (
              <div className="space-y-2">
                {rooms?.map((room: any) => (
                  <div key={room.roomId} className="p-3 rounded border border-border/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{room.roomName}</span>
                      <span className="text-xs text-muted-foreground">
                        {room.memberCount} members
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1 bg-primary rounded"
                        style={{ width: `${Math.max(room.messageCount * 0.1, 5)}px` }}
                      />
                      <span className="text-xs text-primary font-mono">
                        {room.messageCount} messages
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && heatmap && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm">Hourly Activity</h3>
                <div className="grid grid-cols-6 gap-2">
                  {heatmap.map((data: any) => (
                    <div key={data.hour} className="text-center">
                      <div
                        className={cn(
                          'h-12 rounded mb-2 flex items-center justify-center font-semibold text-xs',
                          data.count > 20
                            ? 'bg-primary text-primary-foreground'
                            : data.count > 10
                            ? 'bg-primary/50'
                            : 'bg-secondary'
                        )}
                      >
                        {data.count}
                      </div>
                      <span className="text-xs text-muted-foreground">{data.hour}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const MetricCard: React.FC<{ label: string; value: number; icon: string }> = ({
  label,
  value,
  icon,
}) => (
  <div className="p-4 rounded border border-border/30 bg-secondary/20">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-primary font-mono">{value}</p>
      </div>
      <span className="text-3xl opacity-50">{icon}</span>
    </div>
  </div>
);
