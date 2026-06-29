import React, { useState, useEffect } from 'react';

export const BookmarkList: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<any[]>([]);

  useEffect(() => { fetch('/api/bookmarks').then(r => r.json()).then(setBookmarks); }, []);

  const deleteBookmark = async (id: string) => {
    await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' });
    setBookmarks(bookmarks.filter(b => b.id !== id));
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="font-semibold mb-4">Bookmarks</h3>
      {bookmarks.map(b => (
        <div key={b.id} className="flex justify-between items-center p-3 border rounded mb-2">
          <div>
            <p className="text-sm">{b.note || 'No note'}</p>
            <p className="text-xs text-gray-500">{b.message_id}</p>
          </div>
          <button onClick={() => deleteBookmark(b.id)} className="text-red-500 text-sm">✕</button>
        </div>
      ))}
    </div>
  );
};