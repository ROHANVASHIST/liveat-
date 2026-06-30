import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

interface ScheduledMessage {
  id: string;
  senderId: string;
  content: string;
  roomId: string;
  scheduledAt: string;
  status: 'pending' | 'sent' | 'cancelled';
  senderName?: string;
}

export class ScheduleService {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  async scheduleMessage(data: ScheduledMessage): Promise<ScheduledMessage> {
    const { data: saved, error } = await supabase
      .from('scheduled_messages')
      .insert({
        sender_id: data.senderId,
        content: data.content,
        room_id: data.roomId,
        scheduled_at: data.scheduledAt,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    const scheduleTime = new Date(data.scheduledAt).getTime() - Date.now();
    if (scheduleTime > 0) {
      const timer = setTimeout(() => this.sendMessage(saved.id), scheduleTime);
      this.timers.set(saved.id, timer);
    }

    return saved;
  }

  private async sendMessage(scheduleId: string): Promise<void> {
    const { data: msg } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (msg && msg.status === 'pending') {
      await supabase.from('messages').insert({
        sender_id: msg.sender_id,
        sender_name: msg.sender_name || 'Scheduled Message',
        content: msg.content,
        room_id: msg.room_id,
        message_type: 'text'
      });
      await supabase.from('scheduled_messages').update({ status: 'sent' }).eq('id', scheduleId);
    }
  }

  async cancelScheduledMessage(id: string): Promise<void> {
    const timer = this.timers.get(id);
    if (timer) { clearTimeout(timer); this.timers.delete(id); }
    await supabase.from('scheduled_messages').update({ status: 'cancelled' }).eq('id', id);
  }

  async getUserScheduledMessages(userId: string): Promise<ScheduledMessage[]> {
    const { data } = await supabase
      .from('scheduled_messages')
      .select('*')
      .eq('sender_id', userId)
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true });
    return data || [];
  }
}

export const scheduleService = new ScheduleService();