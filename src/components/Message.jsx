import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// Renders a single chat bubble.
// role: 'user' | 'assistant'
export default function Message({ role, content }) {
  const isUser = role === 'user'

  return (
    <div className={`enox-msg enox-msg--${isUser ? 'user' : 'bot'}`}>
      {!isUser && (
        <div className="enox-msg-avatar" aria-hidden="true">✦</div>
      )}
      <div className="enox-msg-bubble">
        {isUser ? (
          <span>{content}</span>
        ) : (
          // AI messages may contain markdown (tables, bold, code, lists…)
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || '▋'}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
