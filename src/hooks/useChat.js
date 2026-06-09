import { useState, useEffect, useRef, useCallback } from 'react'
import { createUser, fetchHistory, streamMessage } from '../api/chat'

const STORAGE_KEY = 'enox_user'
const PAGE_SIZE = 20

// ── Persisted user helpers ───────────────────────────────────────────────────
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

// ── Main hook ────────────────────────────────────────────────────────────────
export function useChat() {
  const [user, setUser] = useState(loadUser)           // null = not registered
  const [messages, setMessages] = useState([])         // { id, role, content, ts }
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

  // ── Register / get user ────────────────────────────────────────────────────
  async function registerUser(name, email) {
    const result = await createUser(name, email)
    saveUser(result)
    setUser(result)
    return result
  }

  // ── Load history on mount when user exists ─────────────────────────────────
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

      // API returns newest-first, we want oldest-first for display
      const mapped = [...res.data].reverse().map((m) => ({
        id: makeId(),
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.message,
        ts: m.timestamp,
      }))

      if (replace) {
        setMessages(mapped)
      } else {
        // Prepend older messages (user scrolled up for more)
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

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || isStreaming || !user) return

      const userMsg = { id: makeId(), role: 'user', content: text, ts: null }
      const botMsg = { id: makeId(), role: 'assistant', content: '', ts: null }

      setMessages((prev) => [...prev, userMsg, botMsg])
      setIsStreaming(true)
      setInputValue('')

      streamController.current = streamMessage(
        text,
        user.session_id,
        // onToken – append each chunk to the last bot message
        (token) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsg.id ? { ...m, content: m.content + token } : m
            )
          )
        },
        // onDone
        () => setIsStreaming(false),
        // onError
        (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botMsg.id
                ? { ...m, content: `⚠️ Error: ${err}` }
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
