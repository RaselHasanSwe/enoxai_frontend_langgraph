import React, { useState, useRef, useEffect } from 'react';
import { useLangChainStream } from './hooks/useLangChainStream';
import { MessageItem } from './components/MessageItem';
import { Send, Cpu } from 'lucide-react';

export default function App() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'stream' | 'complete'>('stream');
  const [sessionId] = useState(() => {
    const existing = localStorage.getItem("sessionId");

    if (existing) return existing;

    const newId = `lc_session_${Math.random().toString(36).substring(2)}`;
    localStorage.setItem("sessionId", newId);

    return newId;
  });

  const { messages, isProcessing, submitMessage } = useLangChainStream({
    apiUrl: 'http://127.0.0.1:9000', 
    sessionId: sessionId,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    submitMessage(input, mode);
    setInput('');
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex p-1.5 bg-indigo-50 rounded-lg text-indigo-600 border border-indigo-100">
            <Cpu size={18} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800">E-Commerce LangChain Portal</h1>
            <p className="text-[10px] text-slate-400 font-mono">Session: {sessionId}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border">
          <button
            onClick={() => setMode('stream')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              mode === 'stream' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Streaming API
          </button>
          <button
            onClick={() => setMode('complete')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              mode === 'complete' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Complete API
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center p-8">
            <div className="bg-indigo-50 border border-indigo-100 text-indigo-600 p-4 rounded-full mb-4 shadow-xs">
              <Cpu size={28} />
            </div>
            <h3 className="text-base font-semibold text-slate-700">LangChain Interface Engine Ready</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Your custom Python agent API layer is mapped. Send a message to run tests against your active graph pipelines.
            </p>
          </div>
        ) : (
          <div className="w-full mx-auto max-w-5xl">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} />
            ))}
            <div ref={scrollRef} />
          </div>
        )}
      </div>

      <div className="border-t bg-white p-4">
        <form onSubmit={handleFormSubmit} className="mx-auto max-w-5xl flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder={
              mode === 'stream'
                ? "Send message via tokenized stream endpoint (/chat/stream)..."
                : "Send message via atomic data block endpoint (/chat)..."
            }
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 transition-all"
          />
          <button
            type="submit"
            disabled={isProcessing || !input.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}