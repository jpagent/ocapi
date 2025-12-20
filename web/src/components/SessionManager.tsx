'use client';

import { useState } from 'react';
import { opencode, Session, Message } from '@/lib/opencode';

export default function SessionManager() {
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');

  const createSession = async () => {
    try {
      const newSession = await opencode.createSession();
      setSession(newSession);
      setMessages([]);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const sendMessage = async () => {
    if (!session || !input.trim()) return;

    try {
      const message = await opencode.sendMessage(session.id, input);
      setMessages(prev => [...prev, message]);
      setInput('');

      // Refresh messages after sending
      const updatedMessages = await opencode.getMessages(session.id);
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const loadMessages = async () => {
    if (!session) return;

    try {
      const msgs = await opencode.getMessages(session.id);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">OpenCode Chat</h1>

      {!session ? (
        <button
          onClick={createSession}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Session
        </button>
      ) : (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Session: {session.id}</h2>
            <button
              onClick={loadMessages}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 ml-2"
            >
              Refresh Messages
            </button>
          </div>

          <div className="border rounded p-4 mb-4 h-64 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className="mb-2">
                <strong>{msg.role}:</strong> {msg.content}
              </div>
            ))}
          </div>

          <div className="flex">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1 border rounded-l px-3 py-2"
              placeholder="Type your message..."
            />
            <button
              onClick={sendMessage}
              className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}