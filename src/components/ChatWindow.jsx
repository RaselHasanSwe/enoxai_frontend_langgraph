import {useEffect, useRef} from 'react'
import Message from './Message'

// The main message list + input bar.
// Props injected from App via useChat hook.
export default function ChatWindow({
                                       user,
                                       messages,
                                       inputValue,
                                       setInputValue,
                                       isStreaming,
                                       loadingHistory,
                                       historyPage,
                                       totalPages,
                                       sendMessage,
                                       cancelStream,
                                       loadOlderMessages,
                                       clearUser,
                                   }) {
    const bottomRef = useRef(null)
    const listRef = useRef(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages])

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(inputValue)
        }
    }

    return (
        <div className="enox-chat-window">
            {/* Greeting bar */}
            <div className="enox-chat-greeting">
                <span>Hi, {user.name} 👋</span>
                <button
                    className="enox-btn-ghost enox-btn-sm"
                    onClick={clearUser}
                    title="Sign out"
                >
                    Sign out
                </button>
            </div>

            {/* Message list */}
            <div className="enox-msg-list" ref={listRef}>
                {/* Load older messages button */}
                {historyPage < totalPages && (
                    <button
                        className="enox-btn-ghost enox-btn-center"
                        onClick={loadOlderMessages}
                        disabled={loadingHistory}
                    >
                        {loadingHistory ? 'Loading…' : '↑ Load older messages'}
                    </button>
                )}

                {messages.length === 0 && !loadingHistory && (
                    <div className="enox-empty">
                        <span>Ask me anything about your order, products, or returns.</span>
                    </div>
                )}

                {messages.map((m) => (
                    <Message
                        key={m.id} role={m.role}
                        content={m.content}
                        products={m.products}     // ← ADD THIS LINE
                        streaming={m.streaming}   // ← ADD THIS LINE
                    />
                ))}

                <div ref={bottomRef}/>
            </div>

            {/* Input bar */}
            <div className="enox-input-bar">
        <textarea
            className="enox-input"
            placeholder="Type a message…"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={isStreaming}
        />
                {isStreaming ? (
                    <button
                        className="enox-btn-stop"
                        onClick={cancelStream}
                        title="Stop"
                    >
                        ■
                    </button>
                ) : (
                    <button
                        className="enox-btn-send"
                        onClick={() => sendMessage(inputValue)}
                        disabled={!inputValue.trim()}
                        title="Send"
                    >
                        ↑
                    </button>
                )}
            </div>
        </div>
    )
}
