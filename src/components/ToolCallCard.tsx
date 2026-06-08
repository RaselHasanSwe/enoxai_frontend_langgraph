import React from 'react';
import { Terminal } from 'lucide-react';

interface ToolCallCardProps {
  tools?: string[];
}

export const ToolCallCard: React.FC<ToolCallCardProps> = ({ tools }) => {
  if (!tools || tools.length === 0) return null;
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3 font-mono text-xs text-amber-800 shadow-xs">
      <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
        <Terminal size={14} />
        LangChain Agent Tool Execution Traces
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1">
        {tools.map((tool, idx) => (
          <span key={idx} className="bg-amber-100 border border-amber-300 text-amber-900 px-2 py-0.5 rounded">
            {tool}
          </span>
        ))}
      </div>
    </div>
  );
};