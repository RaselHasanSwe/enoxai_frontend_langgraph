import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ShieldAlert, Bot, User } from 'lucide-react';
import type { LangChainUiMessage } from '../types/chat';
import { ToolCallCard } from './ToolCallCard';

interface MessageItemProps {
  message: LangChainUiMessage;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const isHuman = message.type === 'human';

  return (
    <div className={`flex w-full gap-4 py-5 px-6 ${isHuman ? 'bg-white' : 'bg-slate-50/80 border-y border-slate-100'}`}>
      <div className={`flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-lg border text-sm font-medium shadow-xs ${
        isHuman ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-200'
      }`}>
        {isHuman ? <User size={15} /> : <Bot size={15} />}
      </div>

      <div className="flex-1 space-y-2 overflow-hidden text-sm text-slate-800">
        {message.error ? (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 font-medium">
            <ShieldAlert size={16} />
            <span>{message.error}</span>
          </div>
        ) : (
          <div className="prose prose-slate max-w-none break-words leading-relaxed">
            <ReactMarkdown>{message.content || (message.isStreaming ? '▍' : '')}</ReactMarkdown>
          </div>
        )}

        <ToolCallCard tools={message.toolCalls} />
      </div>
    </div>
  );
};