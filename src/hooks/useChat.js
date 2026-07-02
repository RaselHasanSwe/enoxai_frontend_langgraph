import { useState, useEffect, useRef, useCallback } from 'react'
import { createUser, fetchHistory, streamMessage, BASE_URL } from '../api/chat'

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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
          // Remove the data:image/...;base64, prefix
          const base64 = reader.result.split(",")[1]
          resolve(base64)
      }

      reader.onerror = reject

      reader.readAsDataURL(file)
  })
}


export function useChat() {
  const [user, setUser] = useState(loadUser)
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [historyPage, setHistoryPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const streamController = useRef(null)
  const nextId = useRef(0)

  function makeId() {
    return ++nextId.current
  }

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
    setLoadingHistory(true)
    try {
      const res = await fetchHistory(userId, page)
      setTotalPages(res.pagination.total_pages)
      setHistoryPage(res.pagination.current_page)

      const mapped = [...res.data].reverse().map((m) => {
        let products = undefined
        let content = m.message
        let imageUrl = undefined

        if (m.image_path) {
          imageUrl = `${BASE_URL}/chat/uploads/${m.image_path}`
        }

        // Try to extract product_data / display text from stored AI JSON
        try {
          const parsed = JSON.parse(m.message)
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.product_data) && parsed.product_data.length > 0) {
              products = parsed.product_data
            }
            if (parsed.message && typeof parsed.message === 'string') {
              content = parsed.message
            }
          }
        } catch {
          // Not JSON, use as is
        }

        return {
          id: makeId(),
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: content,
          imageUrl,
          ts: m.timestamp,
          products: products,
          streaming: false,
        }
      })

      if (replace) {
        setMessages(mapped)
      } else {
        setMessages((prev) => [...mapped, ...prev])
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  async function loadOlderMessages() {
    if (!user || historyPage >= totalPages || loadingHistory) return
    await loadHistory(user.id, historyPage + 1, false)
  }

  const sendMessage = useCallback(
    async (text, selectedImage) => {
      if (!text.trim() || isStreaming || !user) return

      console.log("selectedImage 1:", selectedImage);
      let image_base64 = null
       if (selectedImage) {
            image_base64 = await fileToBase64(selectedImage)
        }

      let imageUrl = null
      if (selectedImage) {
        imageUrl = URL.createObjectURL(selectedImage)
      }

      const userMsg = {
        id: makeId(),
        role: 'user',
        content: text,
        imageUrl,
        ts: null,
        streaming: false,
      }
      const botMsgId = makeId()
      const botMsg = { id: botMsgId, role: 'assistant', content: '', ts: null, products: undefined, streaming: true }

      setMessages((prev) => [...prev, userMsg, botMsg])
      setIsStreaming(true)
      setInputValue('')
      setSelectedImage(null)

      streamController.current = streamMessage(
        text,
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

        // onProductData — set products from SSE event (already parsed by chat.js)
        (products) => {
          console.log("[useChat] Received product_data from SSE:", products.length)
          console.log("[useChat] First product:", products[0])
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === botMsgId) {
                return { ...m, products }
              }
              return m
            })
          )
        },

        // onDone — mark streaming complete
        () => {
          console.log("[useChat] Stream complete")
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === botMsgId) {
                // Final check: if we have products from SSE, keep them
                // Otherwise try to extract from content
                let finalProducts = m.products
                if (!finalProducts) {
                  try {
                    const parsed = JSON.parse(m.content)
                    if (parsed && parsed.product_data) {
                      finalProducts = parsed.product_data
                    }
                  } catch {
                    // Not JSON
                  }
                }
                return { ...m, streaming: false, products: finalProducts }
              }
              return m
            })
          )
          setIsStreaming(false)
        },

        // onError
        (err) => {
          console.error("[useChat] Stream error:", err)
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId
                ? { ...m, content: `⚠️ Error: ${err}`, streaming: false }
                : m
            )
          )
          setIsStreaming(false)
        }
      )
    },
    [isStreaming, user]
  )

  function cancelStream() {
    streamController.current?.abort()
    setMessages((prev) =>
      prev.map((m) => (m.streaming ? { ...m, streaming: false } : m))
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
    historyPage,
    totalPages,
    registerUser,
    sendMessage,
    cancelStream,
    loadOlderMessages,
    clearUser,
    selectedImage,
    setSelectedImage,
  }
}