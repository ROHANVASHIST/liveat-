import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export class PollService {
  async createPoll(roomId: string, userId: string, question: string, options: string[], multipleChoice?: boolean): Promise<any> {
    const { data, error } = await supabase.from('polls').insert({
      room_id: roomId, created_by: userId, question, options,
      multiple_choice: multipleChoice || false
    }).select().single();
    if (error) throw error;
    return data;
  }

  async vote(pollId: string, userId: string, optionIndex: number): Promise<void> {
    const { error } = await supabase.from('poll_votes').insert({ poll_id: pollId, user_id: userId, option_index: optionIndex });
    if (error) throw error;
  }

  async getResults(pollId: string): Promise<any> {
    const { data: poll } = await supabase.from('polls').select('*').eq('id', pollId).single();
    const { data: votes } = await supabase.from('poll_votes').select('*').eq('poll_id', pollId);
    const counts = new Array(poll.options.length).fill(0);
    votes?.forEach((v: any) => counts[v.option_index]++);
    return { ...poll, votes: counts, total: votes?.length || 0 };
  }

  async getRoomPolls(roomId: string): Promise<any[]> {
    const { data } = await supabase.from('polls').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    return data || [];
  }
}

export const pollService = new PollService();