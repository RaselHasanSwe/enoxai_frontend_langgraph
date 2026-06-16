import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ProductCards from './ProductCards'

export default function Message({ role, content, products, streaming }) {
  const isUser = role === 'user'

  console.log("[Message] Component rendered", { role, content: content?.substring(0, 100), products: products?.length, streaming })

  if (isUser) {
    return (
      <div className="enox-msg enox-msg--user">
        <div className="enox-msg-bubble">
          <span>{content}</span>
        </div>
      </div>
    )
  }

  // Detect if this looks like a product JSON envelope (starts with {")
  const looksLikeProductJSON = content && content.trimStart().startsWith('{"')
  console.log("[Message] looksLikeProductJSON:", looksLikeProductJSON)

  // While streaming AND it looks like product JSON, show typing indicator
  // — wait for the full JSON to arrive before rendering anything
  if (streaming && looksLikeProductJSON) {
    console.log("[Message] Showing typing indicator (streaming product JSON)")
    return (
      <div className="enox-msg enox-msg--bot">
        <div className="enox-msg-avatar" aria-hidden="true">✦</div>
        <div className="enox-msg-bubble">
          <span className="enox-typing-indicator">
            <span /><span /><span />
          </span>
        </div>
      </div>
    )
  }

  // Also show typing indicator for normal streaming with no content yet
  if (streaming && !content) {
    console.log("[Message] Showing typing indicator (streaming no content)")
    return (
      <div className="enox-msg enox-msg--bot">
        <div className="enox-msg-avatar" aria-hidden="true">✦</div>
        <div className="enox-msg-bubble">
          <span className="enox-typing-indicator">
            <span /><span /><span />
          </span>
        </div>
      </div>
    )
  }

  // Stream is done (or it's normal text) — now check for product envelope
  let displayText = content
  let matchedProducts = null
  let isProductResponse = false

  console.log("[Message] Checking for product envelope...")
  if (products && products.length > 0) {
    console.log("[Message] Products available:", products.map(p => p.product_name))
    const envelope = tryParseProductEnvelope(content)
    console.log("[Message] Parsed envelope:", envelope)
    if (envelope) {
      isProductResponse = true
      console.log("[Message] Envelope products titles:", envelope.products)
      matchedProducts = matchProductsByTitle(envelope.products, products)
      console.log("[Message] Matched products result:", matchedProducts?.map(p => p.product_name))
      displayText = null
    } else {
      console.log("[Message] No valid envelope found")
    }
  } else {
    console.log("[Message] No products prop or empty products array")
  }

  console.log("[Message] Final state:", {
    isProductResponse,
    matchedProductsCount: matchedProducts?.length,
    displayText: displayText?.substring(0, 100)
  })

  return (
    <div className="enox-msg enox-msg--bot">
      <div className="enox-msg-avatar" aria-hidden="true">✦</div>
      <div className="enox-msg-bubble">
        {isProductResponse ? (
          matchedProducts && matchedProducts.length > 0 ? (
            <ProductCards products={matchedProducts} />
          ) : (
            <span>Sorry, I couldn't find those products right now.</span>
          )
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {displayText || '▋'}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}

function tryParseProductEnvelope(text) {
  console.log("[tryParseProductEnvelope] Input text:", text?.substring(0, 200))
  if (!text) {
    console.log("[tryParseProductEnvelope] No text provided")
    return null
  }

  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  console.log("[tryParseProductEnvelope] Stripped text:", stripped.substring(0, 200))

  try {
    const parsed = JSON.parse(stripped)
    console.log("[tryParseProductEnvelope] Parsed JSON:", parsed)
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.products) &&
      parsed.products.length > 0
    ) {
      console.log("[tryParseProductEnvelope] Valid envelope found, products count:", parsed.products.length)
      return parsed
    } else {
      console.log("[tryParseProductEnvelope] Invalid structure - missing products array or empty")
    }
  } catch (error) {
    console.log("[tryParseProductEnvelope] Parse error:", error.message)
  }
  return null
}

function matchProductsByTitle(titles, products) {
  console.log("[matchProductsByTitle] Looking for titles:", titles)
  console.log("[matchProductsByTitle] In products:", products.map(p => ({ id: p.product_id, name: p.product_name })))

  const result = titles.reduce((acc, title) => {
    const normalised = title.toLowerCase().trim()
    console.log(`[matchProductsByTitle] Matching "${title}" -> normalized: "${normalised}"`)

    const match = products.find(
      (p) =>
        p.product_name.toLowerCase().includes(normalised) ||
        normalised.includes(p.product_name.toLowerCase())
    )

    if (match) {
      console.log(`[matchProductsByTitle] Found match: "${match.product_name}" (ID: ${match.product_id})`)
      if (!acc.find((a) => a.product_id === match.product_id)) {
        console.log(`[matchProductsByTitle] Adding to results`)
        acc.push(match)
      } else {
        console.log(`[matchProductsByTitle] Duplicate, skipping`)
      }
    } else {
      console.log(`[matchProductsByTitle] No match found for "${title}"`)
    }
    return acc
  }, [])

  console.log("[matchProductsByTitle] Final result count:", result.length)
  return result
}