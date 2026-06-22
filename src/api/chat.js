// All API calls are centralised here.
// Change BASE_URL to your production FastAPI URL before deploying.

const BASE_URL = import.meta.env.VITE_API_BASE_URL

// ── Create or fetch a user session ──────────────────────────────────────────
export async function createUser(name, email) {
  const res = await fetch(`${BASE_URL}/chat/user`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email }),
  })
  if (!res.ok) throw new Error('Failed to create user')
  return res.json() // { id, name, email, session_id }
}

// ── Fetch paginated chat history ─────────────────────────────────────────────
export async function fetchHistory(userId, page = 1) {
  const res = await fetch(
    `${BASE_URL}/chat/history?user_id=${userId}&page=${page}`
  )
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json() // { user, data, pagination }
}

// ── Stream a chat response via SSE ───────────────────────────────────────────
// Callbacks:
//   onToken(token)          — each streamed text chunk
//   onProductData(products) — full product array from search_products tool
//   onDone()                — stream finished cleanly
//   onError(message)        — something went wrong
//
// Returns an AbortController so the caller can cancel.
export function streamMessage(message, sessionId, onToken, onProductData, onDone, onError) {
  const controller = new AbortController()

  fetch(`${BASE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id: sessionId }),
    signal: controller.signal,
  })
    .then(async (res) => {
      if (!res.ok) throw new Error('Stream request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE lines look like: data: {...}\n\n
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete last line

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue

          const jsonStr = trimmed.slice(5).trim()
          if (!jsonStr) continue

          try {
            const parsed = JSON.parse(jsonStr)

            if (parsed.error) {
              onError(parsed.error)
              return
            }

            // Normal text token
            if (parsed.token !== undefined) {
              onToken(parsed.token)
            }

            // Product data event — parse the stringified JSON
            if (parsed.product_data !== undefined) {
              try {
                // If product_data is a string, parse it
                let productData = parsed.product_data
                if (typeof productData === 'string') {
                  productData = JSON.parse(productData)
                }

                // Extract the product_data array from the parsed object
                if (productData && productData.product_data && Array.isArray(productData.product_data)) {
                  onProductData(productData.product_data)
                } else if (Array.isArray(productData)) {
                  // If it's already an array, use it directly
                  onProductData(productData)
                } else {
                  console.warn('Unexpected product_data format:', productData)
                }
              } catch (parseError) {
                console.error('Failed to parse product_data:', parseError)
              }
            }
          } catch {
            // ignore malformed lines
          }
        }
      }
      onDone()
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(err.message)
    })

  return controller
}