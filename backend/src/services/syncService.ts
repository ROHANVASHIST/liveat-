import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export class SyncService {
  async syncUserData(userId: string, deviceId: string, data: any): Promise<void> {
    const { error } = await supabase
      .from('device_sync')
      .upsert({ user_id: userId, device_id: deviceId, data, last_synced: new Date().toISOString() });
    if (error) console.error('Sync error:', error);
  }

  async getSyncData(userId: string, currentDeviceId: string): Promise<any> {
    const { data } = await supabase
      .from('device_sync')
      .select('*')
      .eq('user_id', userId)
      .neq('device_id', currentDeviceId)
      .order('last_synced', { ascending: false })
      .limit(1);
    return data?.[0]?.data || null;
  }

  async getConnectedDevices(userId: string): Promise<any[]> {
    const { data } = await supabase
      .from('device_sync')
      .select('*')
      .eq('user_id', userId)
      .order('last_synced', { ascending: false });
    return data || [];
  }

  async removeDevice(userId: string, deviceId: string): Promise<void> {
    await supabase.from('device_sync').delete().eq('user_id', userId).eq('device_id', deviceId);
  }
}

export const syncService = new SyncService();