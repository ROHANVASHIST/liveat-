import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export class FolderService {
  async createFolder(userId: string, name: string, icon?: string, color?: string): Promise<any> {
    const { data, error } = await supabase.from('chat_folders').insert({
      user_id: userId, name, icon, color
    }).select().single();
    if (error) throw error;
    return data;
  }

  async getFolders(userId: string): Promise<any[]> {
    const { data } = await supabase.from('chat_folders').select('*').eq('user_id', userId).order('created_at');
    return data || [];
  }

  async addRoomToFolder(folderId: string, roomId: string): Promise<void> {
    await supabase.from('folder_rooms').insert({ folder_id: folderId, room_id: roomId });
  }

  async removeRoomFromFolder(folderId: string, roomId: string): Promise<void> {
    await supabase.from('folder_rooms').delete().eq('folder_id', folderId).eq('room_id', roomId);
  }

  async getFolderRooms(folderId: string): Promise<string[]> {
    const { data } = await supabase.from('folder_rooms').select('room_id').eq('folder_id', folderId);
    return data?.map((d: any) => d.room_id) || [];
  }

  async deleteFolder(folderId: string): Promise<void> {
    await supabase.from('folder_rooms').delete().eq('folder_id', folderId);
    await supabase.from('chat_folders').delete().eq('id', folderId);
  }
}

export const folderService = new FolderService();