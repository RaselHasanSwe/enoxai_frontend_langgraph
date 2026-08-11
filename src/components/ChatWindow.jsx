import { useEffect, useRef } from 'react'
import Message from './Message'
import { getClipboardImageFile } from '../utils/imagePreview'
import { focusChatInput } from '../utils/focus'

export default function ChatWindow({
    user,
    messages,
    inputValue,
    setInputValue,
    isStreaming,
    loadingHistory,
    historyError,
    historyPage,
    totalPages,
    sendMessage,
    cancelStream,
    loadOlderMessages,
    clearUser,
    selectedImage,
    imagePreviewUrl,
    imagePreviewLoading,
    selectImage,
    clearSelectedImage,
    isPanelOpen = true,
}) {
    const bottomRef = useRef(null)
    const listRef = useRef(null)
    const fileInputRef = useRef(null)
    const inputRef = useRef(null)
    const wasStreamingRef = useRef(false)
    const wasPanelOpenRef = useRef(isPanelOpen)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        const openedByUser = !wasPanelOpenRef.current && isPanelOpen
        wasPanelOpenRef.current = isPanelOpen

        if (openedByUser && !isStreaming) {
            focusChatInput(inputRef)
        }
    }, [isPanelOpen, isStreaming])

    useEffect(() => {
        if (wasStreamingRef.current && !isStreaming && isPanelOpen) {
            focusChatInput(inputRef)
        }
        wasStreamingRef.current = isStreaming
    }, [isStreaming, isPanelOpen])

    function handleClearImage() {
        clearSelectedImage()
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        focusChatInput(inputRef)
    }

    function handleImageSelect(e) {
        const file = e.target.files?.[0]
        if (file) {
            selectImage(file)
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        focusChatInput(inputRef)
    }

    function canSend() {
        return Boolean(inputValue.trim() || selectedImage)
    }

    function handleSend() {
        if (!canSend() || isStreaming) return
        sendMessage(inputValue)
    }

    function handleKey(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    function handlePaste(e) {
        if (isStreaming) return

        const file = getClipboardImageFile(e.clipboardData)
        if (!file) return

        e.preventDefault()
        selectImage(file)
        focusChatInput(inputRef)
    }

    const showImagePreview = Boolean(selectedImage)

    return (
        <div className="enox-chat-window" onPasteCapture={handlePaste}>
            <div className="enox-chat-greeting">
                <span>Hi, {user.name}</span>
                <button
                    className="enox-btn-ghost enox-btn-sm"
                    onClick={clearUser}
                    title="Sign out"
                >
                    Sign out
                </button>
            </div>

            <div className="enox-msg-list" ref={listRef}>
                {historyError && (
                    <div className="enox-empty">
                        <span>{historyError}</span>
                    </div>
                )}

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
                        cancelled={m.cancelled}
                    />
                ))}

                <div ref={bottomRef} />
            </div>

            <div className="enox-input-area">
                {showImagePreview && (
                    <div className="enox-image-preview">
                        <div
                            className="enox-image-preview-thumb"
                            aria-busy={imagePreviewLoading}
                            aria-label={imagePreviewLoading ? 'Loading image preview' : 'Image preview'}
                        >
                            {imagePreviewUrl ? (
                                <img
                                    src={imagePreviewUrl}
                                    alt="Attachment preview"
                                />
                            ) : (
                                <div className="enox-image-preview-placeholder" aria-hidden="true" />
                            )}
                            {imagePreviewLoading && (
                                <div className="enox-image-preview-overlay" aria-hidden="true">
                                    <div className="enox-image-preview-spinner" />
                                </div>
                            )}
                            <button
                                type="button"
                                className="enox-image-preview-remove"
                                onClick={handleClearImage}
                                aria-label="Remove image"
                                title="Remove image"
                            >
                                ×
                            </button>
                        </div>
                        <div className="enox-image-preview-meta">
                            <span className="enox-image-preview-name">{selectedImage.name}</span>
                            {imagePreviewLoading && (
                                <span className="enox-image-preview-status">Preparing preview…</span>
                            )}
                        </div>
                    </div>
                )}

                <div className="enox-input-bar">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        id="image-upload"
                        hidden
                        onChange={handleImageSelect}
                        disabled={isStreaming}
                    />

                    <label
                        htmlFor="image-upload"
                        className={`enox-btn-image${isStreaming ? ' enox-btn-image--disabled' : ''}`}
                        title="Attach image"
                        aria-label="Attach image"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" />
                            <path d="M3 16l4.5-4.5 3 3L14 11l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </label>

                    <textarea
                        ref={inputRef}
                        className="enox-input"
                        placeholder={selectedImage ? 'Describe this image…' : 'Type your message…'}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKey}
                        rows={1}
                        disabled={isStreaming}
                        aria-label="Message input"
                    />

                    {isStreaming ? (
                        <button
                            type="button"
                            className="enox-btn-stop"
                            onClick={cancelStream}
                            title="Stop response"
                            aria-label="Stop response"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <rect x="6" y="6" width="12" height="12" rx="1" />
                            </svg>
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="enox-btn-send"
                            onClick={handleSend}
                            disabled={!canSend()}
                            title="Send message"
                            aria-label="Send message"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h12M13 7l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
