import { useState, useCallback } from 'react';
import type { LangChainUiMessage, ChatResponse } from '../types/chat';

interface UseStreamProps {
  apiUrl: string;
  sessionId: string;
}

export function useLangChainStream({ apiUrl, sessionId }: UseStreamProps) {
  const [messages, setMessages] = useState<LangChainUiMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const submitMessage = useCallback(async (text: string, mode: 'stream' | 'complete' = 'stream') => {
    if (!text.trim()) return;

    const userMsgId = crypto.randomUUID();
    const aiMsgId = crypto.randomUUID();


    setMessages((prev) => [...prev, { id: userMsgId, type: 'human', content: text }]);
    setIsProcessing(true);

    if (mode === 'complete') {
      try {
        const res = await fetch(`${apiUrl}/api/v1/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: sessionId }),
        });
        if (!res.ok) throw new Error('Failed to fetch chat response');
        
        const data: ChatResponse = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: aiMsgId, type: 'ai', content: data.answer, toolCalls: data.tool_calls }
        ]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          { id: aiMsgId, type: 'ai', content: '', error: err.message || 'Error executing agent pipeline.' }
        ]);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, type: 'ai', content: '', isStreaming: true }
      ]);

      try {
        const res = await fetch(`${apiUrl}/api/v1/chat/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: sessionId }),
        });

        if (!res.ok) throw new Error('Failed to initialize LangChain stream pipeline');
        if (!res.body) throw new Error('ReadableStream omitted by environment infrastructure');

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let currentAiText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine.startsWith('data: ')) continue;

            const rawJson = cleanLine.slice(6);
            try {
              const payload = JSON.parse(rawJson);

              if (payload.error) throw new Error(payload.error);

              if (payload.token) {
                currentAiText += payload.token;
                setMessages((prev) =>
                  prev.map((m) => (m.id === aiMsgId ? { ...m, content: currentAiText } : m))
                );
              }

              if (payload.done) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, isStreaming: false, toolCalls: payload.tool_calls || [] }
                      : m
                  )
                );
              }
            } catch (e) {
              console.error("Malformed SSE packet:", rawJson, e);
            }
          }
        }
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((m) => (m.id === aiMsgId ? { ...m, isStreaming: false, error: err.message } : m))
        );
      } finally {
        setIsProcessing(false);
      }
    }
  }, [apiUrl, sessionId]);

  return { messages, isProcessing, submitMessage };
}