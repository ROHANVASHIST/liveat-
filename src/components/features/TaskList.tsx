import React, { useState, useEffect } from 'react';

interface Task {
  id: string; title: string; description?: string; priority: string;
  status: string; assigned_to: string; due_date?: string;
}

export const TaskList: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('medium');

  useEffect(() => {
    fetch(`/api/rooms/${roomId}/tasks`).then(r => r.json()).then(setTasks);
  }, [roomId]);

  const createTask = async () => {
    if (!title.trim() || !assignee.trim()) return;
    await fetch('/api/tasks', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ roomId, assignedTo: assignee, title, priority }) });
    setShowCreate(false); setTitle(''); setAssignee('');
    const res = await fetch(`/api/rooms/${roomId}/tasks`);
    setTasks(await res.json());
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/tasks/${id}/status`, { method: 'PATCH', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status }) });
    const res = await fetch(`/api/rooms/${roomId}/tasks`); setTasks(await res.json());
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Tasks</h3>
        <button onClick={() => setShowCreate(true)} className="text-blue-600">+ Add Task</button>
      </div>
      {showCreate && (
        <div className="mb-4 p-3 border rounded space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" className="w-full px-3 py-2 border rounded" />
          <input value={assignee} onChange={e => setAssignee(e.target.value)} placeholder="Assign to (user ID)" className="w-full px-3 py-2 border rounded" />
          <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 border rounded">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <button onClick={createTask} className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </div>
      )}
      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className={`p-3 border rounded ${task.status === 'completed' ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-gray-500">Assigned to: {task.assigned_to}</p>
                <span className={`text-xs px-2 py-1 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>{task.priority}</span>
              </div>
              {task.status !== 'completed' && <button onClick={() => updateStatus(task.id, 'completed')} className="text-green-600">✓</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};