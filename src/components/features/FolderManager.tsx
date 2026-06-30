import React, { useState, useEffect } from 'react';

export const FolderManager: React.FC = () => {
  const [folders, setFolders] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => { fetch('/api/folders').then(r => r.json()).then(setFolders); }, []);

  const createFolder = async () => {
    if (!name.trim()) return;
    await fetch('/api/folders', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name }) });
    setName(''); setShowCreate(false);
    const res = await fetch('/api/folders'); setFolders(await res.json());
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Chat Folders</h3>
        <button onClick={() => setShowCreate(true)} className="text-blue-600">+ New Folder</button>
      </div>
      {showCreate && (
        <div className="mb-4 flex gap-2">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Folder name" className="flex-1 px-3 py-2 border rounded" />
          <button onClick={createFolder} className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </div>
      )}
      <div className="space-y-2">
        {folders.map(folder => (
          <div key={folder.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <p className="font-medium">{folder.name}</p>
              <p className="text-xs text-gray-500">{folder.icon || '📁'} {folder.color || ''}</p>
            </div>
            <button className="text-gray-400">→</button>
          </div>
        ))}
      </div>
    </div>
  );
};