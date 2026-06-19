import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

class EnoXChatWidget extends HTMLElement {
  constructor() {
    super()
    this._root = null
  }

  connectedCallback() {
    const mountPoint = document.createElement('div')
    this.appendChild(mountPoint)
    this._root = createRoot(mountPoint)
    this._root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  }

  disconnectedCallback() {
    this._root?.unmount()
  }
}

// Register as a custom element
if (!customElements.get('enox-chat')) {
  customElements.define('enox-chat', EnoXChatWidget)
}
