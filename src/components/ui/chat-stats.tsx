import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { ScrollArea } from './scroll-area';
import { cn } from '@/lib/utils';
import { BarChart3, MessageSquare, Clock, Calendar, Smile, Type, Users } from 'lucide-react';

interface ChatStatsProps {
  isOpen: boolean;
  onClose: () => void;
  messages: any[];
  currentUserId?: string;
}

const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}]/gu;

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const ChatStats: React.FC<ChatStatsProps> = ({
  isOpen,
  onClose,
  messages,
  currentUserId,
}) => {
  const stats = useMemo(() => {
    const msgs = currentUserId
      ? messages.filter(m => m.senderId === currentUserId)
      : messages;

    if (msgs.length === 0) {
      return {
        totalMessages: 0,
        mostActiveDay: 'N/A',
        mostUsedEmoji: 'N/A',
        averageLength: 0,
        busiestHour: 'N/A',
        topSenders: [] as { name: string; count: number }[],
      };
    }

    const dayCount: Record<number, number> = {};
    const hourCount: Record<number, number> = {};
    const emojiCount: Record<string, number> = {};
    const senderCount: Record<string, { name: string; count: number }> = {};
    let totalLength = 0;

    msgs.forEach((m: any) => {
      const date = new Date(m.timestamp);
      const day = date.getDay();
      const hour = date.getHours();

      dayCount[day] = (dayCount[day] || 0) + 1;
      hourCount[hour] = (hourCount[hour] || 0) + 1;

      if (m.content) {
        totalLength += m.content.length;
        const emojis = m.content.match(EMOJI_REGEX);
        if (emojis) {
          emojis.forEach((e: string) => {
            emojiCount[e] = (emojiCount[e] || 0) + 1;
          });
        }
      }

      const senderName = m.senderName || 'Unknown';
      if (!senderCount[m.senderId || senderName]) {
        senderCount[m.senderId || senderName] = { name: senderName, count: 0 };
      }
      senderCount[m.senderId || senderName].count++;
    });

    const mostActiveDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
    const busiestHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0];
    const mostUsedEmoji = Object.entries(emojiCount).sort((a, b) => b[1] - a[1])[0];
    const topSenders = Object.values(senderCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalMessages: msgs.length,
      mostActiveDay: mostActiveDay ? DAY_NAMES[parseInt(mostActiveDay[0])] : 'N/A',
      mostUsedEmoji: mostUsedEmoji ? mostUsedEmoji[0] : 'N/A',
      averageLength: Math.round(totalLength / msgs.length),
      busiestHour: busiestHour ? `${busiestHour[0]}:00 - ${parseInt(busiestHour[0]) + 1}:00` : 'N/A',
      topSenders,
    };
  }, [messages, currentUserId]);

  const statCards = [
    { icon: MessageSquare, label: 'Total Messages', value: stats.totalMessages.toLocaleString() },
    { icon: Calendar, label: 'Most Active Day', value: stats.mostActiveDay },
    { icon: Smile, label: 'Most Used Emoji', value: stats.mostUsedEmoji },
    { icon: Type, label: 'Avg Length', value: `${stats.averageLength} chars` },
    { icon: Clock, label: 'Busiest Hour', value: stats.busiestHour },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="border-border p-0 bg-background font-mono sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader className="p-5 border-b border-border">
          <DialogTitle className="text-sm font-bold uppercase tracking-[0.2em] flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" />
            CHAT::STATISTICS_NODE
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {statCards.map(card => (
                <div key={card.label} className="tech-card p-4 flex flex-col items-center gap-2 text-center">
                  <card.icon size={16} className="text-primary" />
                  <span className="text-[20px] font-bold text-foreground font-mono tracking-tight">
                    {card.value}
                  </span>
                  <span className="text-[7px] uppercase tracking-[0.2em] text-muted-foreground font-bold">
                    {card.label}
                  </span>
                </div>
              ))}
            </div>

            {stats.topSenders.length > 0 && !currentUserId && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={12} className="text-primary" />
                  <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-bold">Top Senders</span>
                </div>
                <div className="space-y-1">
                  {stats.topSenders.map((sender, i) => (
                    <div
                      key={sender.name}
                      className="flex items-center gap-3 px-3 py-2.5 border border-border"
                    >
                      <span className="text-[8px] font-bold text-muted-foreground w-4 text-right">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider truncate">
                            {sender.name}
                          </span>
                          <span className="text-[9px] text-primary font-mono ml-2">
                            {sender.count}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${(sender.count / stats.totalMessages) * 100}%` }}
                          />
                        </div>
                      </div>
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
