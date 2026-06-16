import { useState, useEffect, useRef, useCallback } from 'react'
import { createUser, fetchHistory, streamMessage } from '../api/chat'

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

      const mapped = [...res.data].reverse().map((m) => ({
        id: makeId(),
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.message,
        ts: m.timestamp,
        products: undefined,
        streaming: false,
      }))

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
    async (text) => {
      if (!text.trim() || isStreaming || !user) return

      const userMsg = { id: makeId(), role: 'user', content: text, ts: null, streaming: false }
      const botMsgId = makeId()
      const botMsg = { id: botMsgId, role: 'assistant', content: '', ts: null, products: undefined, streaming: true }

      setMessages((prev) => [...prev, userMsg, botMsg])
      setIsStreaming(true)
      setInputValue('')

      streamController.current = streamMessage(
        text,
        user.session_id,

        // onToken — stream tokens into content as they arrive
        // Message.jsx will suppress rendering if content starts with {"
        (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, content: m.content + token } : m
            )
          )
        },

        // onProductData — attach product array to the message
        (products) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, products } : m
            )
          )
        },

        // onDone — mark streaming finished so Message renders final content
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsgId ? { ...m, streaming: false } : m
            )
          )
          setIsStreaming(false)
        },

        // onError
        (err) => {
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
  }
}