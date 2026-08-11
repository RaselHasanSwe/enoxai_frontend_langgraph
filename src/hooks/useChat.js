import { useState, useEffect, useRef, useCallback } from 'react'
import { createUser, fetchHistory, streamMessage, BASE_URL } from '../api/chat'
import { parseAssistantMessage } from '../utils/parseMessageContent'
import { createThumbnailPreview, createDisplayPreview, fileToBase64, validateImageFile } from '../utils/imagePreview'

const STORAGE_KEY = 'enox_user'

function loadUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}


export function useChat() {
  const [user, setUser] = useState(loadUser)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null)
  const [imagePreviewLoading, setImagePreviewLoading] = useState(false)

  const streamController = useRef(null)
  const nextId = useRef(0)
  const imageTaskRef = useRef(0)
  const preparedBase64Ref = useRef(null)
  const previewUrlRef = useRef(null)
  const displayUrlRef = useRef(null)

  function revokeImageUrl(url) {
    if (url) URL.revokeObjectURL(url)
  }

  function clearImageUrls() {
    revokeImageUrl(previewUrlRef.current)
    revokeImageUrl(displayUrlRef.current)
    previewUrlRef.current = null
    displayUrlRef.current = null
  }

  function makeId() {
    return ++nextId.current
  }

  const clearSelectedImage = useCallback(() => {
    imageTaskRef.current += 1
    preparedBase64Ref.current = null
    setSelectedImage(null)
    setImagePreviewLoading(false)
    clearImageUrls()
    setImagePreviewUrl(null)
  }, [])

  const selectImage = useCallback(async (file) => {
    if (!file) return

    try {
      validateImageFile(file)
    } catch (err) {
      setHistoryError(err.message || 'Unsupported image file.')
      return
    }

    const taskId = ++imageTaskRef.current
    preparedBase64Ref.current = null
    clearImageUrls()

    setSelectedImage(file)
    setImagePreviewUrl(null)
    setImagePreviewLoading(true)

    fileToBase64(file)
      .then((base64) => {
        if (imageTaskRef.current === taskId) {
          preparedBase64Ref.current = base64
        }
      })
      .catch(() => {
        if (imageTaskRef.current === taskId) {
          preparedBase64Ref.current = null
        }
      })

    try {
      const [thumbUrl, displayUrl] = await Promise.all([
        createThumbnailPreview(file),
        createDisplayPreview(file),
      ])
      if (imageTaskRef.current !== taskId) {
        revokeImageUrl(thumbUrl)
        revokeImageUrl(displayUrl)
        return
      }
      previewUrlRef.current = thumbUrl
      displayUrlRef.current = displayUrl
      setImagePreviewUrl(thumbUrl)
    } catch {
      if (imageTaskRef.current === taskId) {
        previewUrlRef.current = null
        setImagePreviewUrl(null)
      }
    } finally {
      if (imageTaskRef.current === taskId) {
        setImagePreviewLoading(false)
      }
    }
  }, [])

  async function registerUser(name, email) {
    const result = await createUser(name, email)
    saveUser(result)
    setUser(result)
    return result
  }

  useEffect(() => {
    if (!user) return
    loadHistory(user.id, 1, true)
  }, [user?.id])

  async function loadHistory(userId, page, replace = false) {
    if (!user?.session_id) return
    setLoadingHistory(true)
    setHistoryError('')
    try {
      const res = await fetchHistory(userId, user.session_id, page)
      setTotalPages(res.pagination.total_pages)
      setHistoryPage(res.pagination.current_page)

      const mapped = [...res.data].reverse().map((m) => {
        let imageUrl = undefined

        if (m.image_path) {
          imageUrl = `${BASE_URL}/chat/uploads/${m.image_path}`
        }

        const isAssistant = m.role === 'ai'
        const normalized = isAssistant
          ? parseAssistantMessage(m.message)
          : { content: m.message, products: undefined }

        return {
          id: makeId(),
          role: isAssistant ? 'assistant' : 'user',
          content: normalized.content,
          imageUrl,
          ts: m.timestamp,
          products: normalized.products,
          streaming: false,
        }
      })

      if (replace) {
        setMessages(mapped)
      } else {
        setMessages((prev) => [...mapped, ...prev])
      }
    } catch {
      setHistoryError('Could not load chat history. You can still send new messages.')
    } finally {
      setLoadingHistory(false)
    }
  }

  async function loadOlderMessages() {
    if (!user || historyPage >= totalPages || loadingHistory) return
    await loadHistory(user.id, historyPage + 1, false)
  }

  const sendMessage = useCallback(
    async (text) => {
      const trimmedText = text.trim()
      const imageFile = selectedImage
      if ((!trimmedText && !imageFile) || isStreaming || !user) return

      const messageImageUrl = displayUrlRef.current || imagePreviewUrl
      const messageText = trimmedText || 'Please help me with this image.'

      const userMsg = {
        id: makeId(),
        role: 'user',
        content: messageText,
        imageUrl: messageImageUrl,
        ts: null,
        streaming: false,
      }
      const botMsgId = makeId()
      const botMsg = { id: botMsgId, role: 'assistant', content: '', ts: null, products: undefined, streaming: true }

      setMessages((prev) => [...prev, userMsg, botMsg])
      setIsStreaming(true)
      setInputValue('')

      // Detach image URLs from composer — keep display URL alive for the sent message
      imageTaskRef.current += 1
      const preparedBase64 = preparedBase64Ref.current
      preparedBase64Ref.current = null

      const thumbUrl = previewUrlRef.current
      const sentDisplayUrl = displayUrlRef.current
      previewUrlRef.current = null
      displayUrlRef.current = null

      if (thumbUrl && thumbUrl !== sentDisplayUrl) {
        revokeImageUrl(thumbUrl)
      }

      setSelectedImage(null)
      setImagePreviewUrl(null)
      setImagePreviewLoading(false)

      let image_base64 = null
      if (imageFile) {
        image_base64 = preparedBase64
        if (!image_base64) {
          image_base64 = await fileToBase64(imageFile)
        }
      }

      streamController.current = streamMessage(
        messageText,
        user.session_id,
        image_base64,
        // onToken — accumulate content
        (token) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === botMsgId) {
                return { ...m, content: m.content + token }
              }
              return m
            })
          )
        },

        // onProductData — set products + friendly message from structured SSE event
        (products, productMessage) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === botMsgId) {
                const normalized = parseAssistantMessage(
                  productMessage || m.content,
                  products
                )
                return {
                  ...m,
                  content: normalized.content,
                  products: normalized.products,
                }
              }
              return m
            })
          )
        },

        // onDone — mark streaming complete
        () => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === botMsgId) {
                const normalized = parseAssistantMessage(m.content, m.products)
                return {
                  ...m,
                  streaming: false,
                  content: normalized.content,
                  products: normalized.products,
                }
              }
              return m
            })
          )
          setIsStreaming(false)
        },

        // onError
        (err) => {
          const userMessage = import.meta.env.DEV
            ? `⚠️ Error: ${err}`
            : 'Something went wrong. Please try again.'
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, content: userMessage, streaming: false }
                : m
            )
          )
          setIsStreaming(false)
        }
      )
    },
    [isStreaming, user, selectedImage, imagePreviewUrl]
  )

  function cancelStream() {
    streamController.current?.abort()
    setMessages((prev) =>
      prev.map((m) => (
        m.streaming
          ? {
              ...m,
              streaming: false,
              cancelled: !m.content?.trim(),
              content: m.content?.trim() ? m.content : 'Response cancelled.',
            }
          : m
      ))
    )
    setIsStreaming(false)
  }

  function clearUser() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    setMessages([])
  }

  return {
    user,
    messages,
    inputValue,
    setInputValue,
    isStreaming,
    loadingHistory,
    historyError,
    historyPage,
    totalPages,
    registerUser,
    sendMessage,
    cancelStream,
    loadOlderMessages,
    clearUser,
    selectedImage,
    imagePreviewUrl,
    imagePreviewLoading,
    selectImage,
    clearSelectedImage,
  }
}