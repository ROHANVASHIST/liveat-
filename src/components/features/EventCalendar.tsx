import React, { useState, useEffect } from 'react';

interface Event {
  id: string; title: string; event_date: string; location?: string; attendees?: any;
}

export const EventCalendar: React.FC<{ roomId: string }> = ({ roomId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => { fetch(`/api/rooms/${roomId}/events`).then(r => r.json()).then(setEvents); }, [roomId]);

  const createEvent = async () => {
    if (!title.trim() || !date) return;
    await fetch('/api/events', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ roomId, title, eventDate: date, location }) });
    setShowCreate(false); setTitle(''); setDate(''); setLocation('');
    const res = await fetch(`/api/rooms/${roomId}/events`); setEvents(await res.json());
  };

  const rsvp = async (eventId: string, status: 'going' | 'maybe' | 'declined') => {
    await fetch(`/api/events/${eventId}/rsvp`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ status }) });
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Events</h3>
        <button onClick={() => setShowCreate(true)} className="text-blue-600">+ Create Event</button>
      </div>
      {showCreate && (
        <div className="mb-4 p-3 border rounded space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title" className="w-full px-3 py-2 border rounded" />
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 border rounded" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (optional)" className="w-full px-3 py-2 border rounded" />
          <button onClick={createEvent} className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </div>
      )}
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="p-3 border rounded">
            <p className="font-medium">{event.title}</p>
            <p className="text-sm text-gray-500">{new Date(event.event_date).toLocaleString()}</p>
            {event.location && <p className="text-sm text-gray-500">📍 {event.location}</p>}
            <div className="flex gap-2 mt-2">
              <button onClick={() => rsvp(event.id, 'going')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Going</button>
              <button onClick={() => rsvp(event.id, 'maybe')} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">Maybe</button>
              <button onClick={() => rsvp(event.id, 'declined')} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Decline</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};