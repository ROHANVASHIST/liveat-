import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

export class TaskService {
  async createTask(roomId: string, userId: string, data: {
    assignedTo: string; title: string; description?: string; priority?: string; dueDate?: string
  }): Promise<any> {
    const { data: task, error } = await supabase.from('tasks').insert({
      room_id: roomId, created_by: userId, assigned_to: data.assignedTo,
      title: data.title, description: data.description, priority: data.priority || 'medium',
      due_date: data.dueDate
    }).select().single();
    if (error) throw error;
    return task;
  }

  async updateStatus(taskId: string, status: string): Promise<void> {
    await supabase.from('tasks').update({
      status, completed_at: status === 'completed' ? new Date().toISOString() : null
    }).eq('id', taskId);
  }

  async getRoomTasks(roomId: string): Promise<any[]> {
    const { data } = await supabase.from('tasks').select('*').eq('room_id', roomId).order('created_at', { ascending: false });
    return data || [];
  }

  async getUserTasks(userId: string): Promise<any[]> {
    const { data } = await supabase.from('tasks').select('*').eq('assigned_to', userId).order('due_date', { ascending: true });
    return data || [];
  }

  async deleteTask(taskId: string): Promise<void> {
    await supabase.from('tasks').delete().eq('id', taskId);
  }
}

export const taskService = new TaskService();