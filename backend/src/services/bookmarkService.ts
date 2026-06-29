import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export class BookmarkService {
  async createBookmark(userId: string, messageId: string, note?: string): Promise<any> {
    const { data, error } = await supabase.from('bookmarks').insert({
      user_id: userId, message_id: messageId, note
    }).select().single();
    if (error) { if (error.code === '23505') throw new Error('Already bookmarked');
    throw error; }
    return data;
  }

  async getBookmarks(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('bookmarks')
      .select('*, messages(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return data || [];
  }

  async deleteBookmark(bookmarkId: string): Promise<void> {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId);
  }
}

export const bookmarkService = new BookmarkService();