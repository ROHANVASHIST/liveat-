import React, { useState } from 'react';

export const ScheduleMessage: React.FC<{ roomId: string; onClose: () => void }> = ({ roomId, onClose }) => {
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const schedule = async () => {
    if (!content.trim() || !scheduledAt) return;
    await fetch('/api/schedule/message', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ content, roomId, scheduledAt })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Schedule Message</h3>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Message content" className="w-full px-3 py-2 border rounded mb-4 h-24" />
        <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={schedule} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Schedule</button>
        </div>
      </div>
    </div>
  );
};