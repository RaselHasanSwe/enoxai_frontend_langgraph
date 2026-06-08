export interface ChatRequest {
  message: string;
  session_id: string;
}

export interface ChatResponse {
  session_id: string;
  answer: string;
  tool_calls: string[];
}

export interface LangChainUiMessage {
  id: string;
  type: 'human' | 'ai';
  content: string;
  isStreaming?: boolean;
  toolCalls?: string[];
  error?: string;
}