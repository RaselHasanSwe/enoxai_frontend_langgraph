import { useEffect, useState } from 'react'
import { useChat } from './hooks/useChat'
import UserForm from './components/UserForm'
import ChatWindow from './components/ChatWindow'
import './App.css'
import './styles/products.css'

function readHostOpen(hostElement) {
  return Boolean(
    hostElement?.hasAttribute('open') && hostElement.getAttribute('open') !== 'false'
  )
}

// ── Size modes ────────────────────────────────────────────────────────────────
// 'normal'     → default floating box (380 × 560 px)
// 'minimised'  → only the launcher icon is visible
// 'fullscreen' → fills the viewport

export default function App({ hostElement = null }) {
  const [isOpen, setIsOpen] = useState(() => readHostOpen(hostElement))
  const [sizeMode, setSizeMode] = useState('normal')  // 'normal' | 'fullscreen'
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const chat = useChat()

  useEffect(() => {
    if (!hostElement) return

    const syncFromHost = () => {
      const shouldOpen = readHostOpen(hostElement)
      setIsOpen((prev) => {
        if (shouldOpen && !prev) {
          setSizeMode('normal')
        }
        return shouldOpen
      })
    }

    const observer = new MutationObserver(syncFromHost)
    syncFromHost()
    observer.observe(hostElement, { attributes: true, attributeFilter: ['open'] })
    return () => observer.disconnect()
  }, [hostElement])

  function setOpen(next) {
    if (next && !isOpen) setSizeMode('normal')
    setIsOpen(next)
    if (hostElement) {
      if (next) hostElement.setAttribute('open', 'true')
      else hostElement.removeAttribute('open')
    }
  }

  // ── User registration ──────────────────────────────────────────────────────
  async function handleFormSubmit(name, email) {
    setFormLoading(true)
    setFormError('')
    try {
      await chat.registerUser(name, email)
    } catch {
      setFormError('Could not connect. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Toggle open/close ──────────────────────────────────────────────────────
  function toggleOpen() {
    setOpen(!isOpen)
  }

  // ── Determine panel CSS class ──────────────────────────────────────────────
  const panelClass = [
    'enox-panel',
    isOpen ? 'enox-panel--open' : '',
    sizeMode === 'fullscreen' ? 'enox-panel--fullscreen' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="enox-root">
      {/* ── Floating Chat Panel ──────────────────────────────────────────── */}
      <div className={panelClass} role="dialog" aria-label="EnoXAI chat">
        {/* Header */}
        <div className="enox-header">
          <div className="enox-header-brand">
            <span className="enox-logo">✦</span>
            <span className="enox-brand-name">EnoX</span>
          </div>
          <div className="enox-header-actions">
            {/* Fullscreen toggle */}
            {/* <button
              className="enox-icon-btn"
              onClick={() =>
                setSizeMode((m) => (m === 'fullscreen' ? 'normal' : 'fullscreen'))
              }
              title={sizeMode === 'fullscreen' ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {sizeMode === 'fullscreen' ? '⊡' : '⊞'}
            </button> */}
            {/* Minimise / close */}
            <button
              className="enox-icon-btn"
              onClick={toggleOpen}
              title="Minimise"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body — show form if no user, otherwise chat */}
        <div className="enox-body">
          {!chat.user ? (
            <>
              <UserForm
                onSubmit={handleFormSubmit}
                isLoading={formLoading}
              />
              {formError && <p className="enox-error enox-error--global">{formError}</p>}
            </>
          ) : (
            <ChatWindow {...chat} />
          )}
        </div>
      </div>

      {/* ── Floating Launcher Button ─────────────────────────────────────── */}
      <button
        className={`enox-launcher ${isOpen ? 'enox-launcher--active' : ''}`}
        onClick={toggleOpen}
        aria-label={isOpen ? 'Close chat' : 'Open EnoXAI chat'}
        title="EnoXAI"
      >
        {isOpen ? (
          // Down arrow when open
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        ) : (
          // Chat bubble icon when closed
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}
