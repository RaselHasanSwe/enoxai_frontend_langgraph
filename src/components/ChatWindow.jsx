import {useEffect, useRef, useState} from 'react'
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
                                       selectedImage,
                                       setSelectedImage
                                   }) {
    const bottomRef = useRef(null)
    const listRef = useRef(null)
    const fileInputRef = useRef(null)
    const [previewUrl, setPreviewUrl] = useState(null)
    const [previewLoading, setPreviewLoading] = useState(false)

    useEffect(() => {
        if (!selectedImage) {
            setPreviewUrl(null)
            setPreviewLoading(false)
            return
        }
        setPreviewLoading(true)
        const url = URL.createObjectURL(selectedImage)
        setPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [selectedImage])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({behavior: 'smooth'})
    }, [messages])

    function clearSelectedImage() {
        setSelectedImage(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    function handleImageSelect(e) {
        const file = e.target.files?.[0]
        if (file) {
            setSelectedImage(file)
        }
    }

    function canSend() {
        return Boolean(inputValue.trim())
    }

    function handleSend() {
        if (!canSend() || isStreaming) return
        sendMessage(inputValue, selectedImage)
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
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
                        key={m.id}
                        role={m.role}
                        content={m.content}
                        imageUrl={m.imageUrl}
                        products={m.products}
                        streaming={m.streaming}
                    />
                ))}

                <div ref={bottomRef}/>
            </div>

            {/* Input area */}
            <div className="enox-input-area">
                {selectedImage && (
                    <div className="enox-image-preview">
                        <div
                            className="enox-image-preview-thumb"
                            aria-busy={previewLoading}
                            aria-label={previewLoading ? 'Loading image preview' : 'Image preview'}
                        >
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Attachment preview"
                                    onLoad={() => setPreviewLoading(false)}
                                    onError={() => setPreviewLoading(false)}
                                />
                            ) : (
                                <div className="enox-image-preview-placeholder" aria-hidden="true"/>
                            )}
                            {previewLoading && (
                                <div className="enox-image-preview-overlay" aria-hidden="true">
                                    <div className="enox-image-preview-spinner"/>
                                </div>
                            )}
                            <button
                                type="button"
                                className="enox-image-preview-remove"
                                onClick={clearSelectedImage}
                                aria-label="Remove image"
                                title="Remove image"
                            >
                                ×
                            </button>
                        </div>
                        <span className="enox-image-preview-name">{selectedImage.name}</span>
                    </div>
                )}

                <div className="enox-input-bar">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        id="image-upload"
                        hidden
                        onChange={handleImageSelect}
                    />

                    <label
                        htmlFor="image-upload"
                        className="enox-btn-image"
                        title="Attach image"
                        aria-label="Attach image"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path
                                d="M19 5h-2V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v1H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM9 4h6v1H9V4zm10 15H5V7h14v12z"
                                fill="currentColor"
                            />
                            <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                    </label>

                    <textarea
                        className="enox-input"
                        placeholder={selectedImage ? 'Describe this image (required)…' : 'Type a message…'}
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
                            onClick={handleSend}
                            disabled={!canSend()}
                            title="Send"
                        >
                            ↑
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
