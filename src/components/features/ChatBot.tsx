import React, { useState } from 'react';

interface ChatBotProps {
  onSendMessage: (message: string) => void;
}

export const ChatBot: React.FC<ChatBotProps> = ({ onSendMessage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{role: string; content: string}[]>([
    {role: 'bot', content: 'Hi! How can I help you today?'}
  ]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage('');
    setMessages(prev => [...prev, {role: 'user', content: userMsg}]);
    
    try {
      const res = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({message: userMsg, userId: 'current'})
      });
      const data = await res.json();
      setMessages(prev => [...prev, {role: 'bot', content: data.response}]);
    } catch {
      setMessages(prev => [...prev, {role: 'bot', content: 'Sorry, I had an error.'}]);
    }
  };

  if (!isOpen) return <button onClick={() => setIsOpen(true)} className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700">🤖 Chat</button>;
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-xl border z-50">
      <div className="flex justify-between items-center p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <h3 className="font-semibold">AI Assistant</h3>
        <button onClick={() => setIsOpen(false)}>✕</button>
      </div>
      <div className="h-80 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3/4 p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t flex gap-2">
        <input value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded" />
        <button onClick={handleSend} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Send</button>
      </div>
    </div>
  );
};