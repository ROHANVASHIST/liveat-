import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export class ThemeService {
  async saveTheme(userId: string, name: string, colors: any, background?: string, font?: string): Promise<any> {
    const { data, error } = await supabase.from('chat_themes').upsert({
      user_id: userId, name, colors, background_url: background, font_family: font
    }).select().single();
    if (error) throw error;
    return data;
  }

  async getTheme(userId: string): Promise<any> {
    const { data } = await supabase.from('chat_themes').select('*').eq('user_id', userId).single();
    return data;
  }

  async deleteTheme(themeId: string): Promise<void> {
    await supabase.from('chat_themes').delete().eq('id', themeId);
  }
}

export const themeService = new ThemeService();