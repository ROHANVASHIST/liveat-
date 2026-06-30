import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export class EventService {
  async createEvent(roomId: string, userId: string, data: {
    title: string; description?: string; eventDate: string; duration?: number; location?: string
  }): Promise<any> {
    const { data: event, error } = await supabase.from('events').insert({
      room_id: roomId, created_by: userId, title: data.title,
      description: data.description, event_date: data.eventDate,
      duration: data.duration, location: data.location
    }).select().single();
    if (error) throw error;
    return event;
  }

  async getRoomEvents(roomId: string): Promise<any[]> {
    const { data } = await supabase.from('events').select('*').eq('room_id', roomId).order('event_date', { ascending: true });
    return data || [];
  }

  async rsvp(eventId: string, userId: string, status: 'going' | 'maybe' | 'declined'): Promise<void> {
    const { data: event } = await supabase.from('events').select('attendees').eq('id', eventId).single();
    if (!event) throw new Error('Event not found');
    const attendees = event.attendees || {};
    attendees[userId] = status;
    await supabase.from('events').update({ attendees }).eq('id', eventId);
  }

  async deleteEvent(eventId: string): Promise<void> {
    await supabase.from('events').delete().eq('id', eventId);
  }
}

export const eventService = new EventService();