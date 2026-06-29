import React, { useState } from 'react';

interface PollCreatorProps {
  roomId: string;
  onClose: () => void;
}

export const PollCreator: React.FC<PollCreatorProps> = ({ roomId, onClose }) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);

  const addOption = () => setOptions([...options, '']);
  const updateOption = (i: number, v: string) => { const o = [...options]; o[i] = v; setOptions(o); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };

  const createPoll = async () => {
    if (!question.trim() || options.some(o => !o.trim())) return;
    await fetch('/api/polls', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ roomId, question, options: options.filter(o => o.trim()), multipleChoice })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Create Poll</h3>
        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Ask a question..." className="w-full px-3 py-2 border rounded mb-4" />
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input value={opt} onChange={e => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="flex-1 px-3 py-2 border rounded" />
            {options.length > 2 && <button onClick={() => removeOption(i)} className="text-red-500">✕</button>}
          </div>
        ))}
        <button onClick={addOption} className="text-blue-600 text-sm mb-4">+ Add Option</button>
        <label className="flex items-center gap-2 mb-4"><input type="checkbox" checked={multipleChoice} onChange={e => setMultipleChoice(e.target.checked)} /> Multiple choice</label>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
          <button onClick={createPoll} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Create</button>
        </div>
      </div>
    </div>
  );
};