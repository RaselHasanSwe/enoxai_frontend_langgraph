import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ProductCards from './ProductCards'

export default function Message({role, content, products, streaming}) {
    const isUser = role === 'user'

    if (isUser) {
        return (
            <div className="enox-msg enox-msg--user">
                <div className="enox-msg-bubble">
                    <span>{content}</span>
                </div>
            </div>
        )
    }

    // If streaming, show typing indicator (don't try to parse JSON yet)
    if (streaming) {
        console.log("[Message] Streaming - showing typing indicator")
        return (
            <div className="enox-msg enox-msg--bot">
                <div className="enox-msg-avatar" aria-hidden="true">✦</div>
                <div className="enox-msg-bubble">
                    <span className="enox-typing-indicator">
                        <span/><span/><span/>
                    </span>
                </div>
            </div>
        )
    }

    // Not streaming anymore - now we can safely process the content
    console.log("[Message] Processing final content")

    let displayText = content
    let matchedProducts = null
    let isProductResponse = false

    // FIRST: Check if products prop is available (from SSE event)
    if (products && Array.isArray(products) && products.length > 0) {
        console.log("[Message] Using products from prop:", products.length)
        // Validate product data
        const validProducts = products.filter(p => p && typeof p === 'object' && p.product_name)
        if (validProducts.length > 0) {
            matchedProducts = validProducts
            isProductResponse = true
            displayText = null
        }
    }

    // SECOND: If no products prop, try to parse content for product_data
    if (!isProductResponse && content) {
        const parsedContent = tryParseProductEnvelope(content)
        if (parsedContent) {
            // Check for product_data
            if (parsedContent.product_data && Array.isArray(parsedContent.product_data) && parsedContent.product_data.length > 0) {
                matchedProducts = parsedContent.product_data
                isProductResponse = true
                displayText = null
                console.log("[Message] Using product_data from content:", matchedProducts.length)
            }
            // Check for products array (titles only)
            else if (parsedContent.products && Array.isArray(parsedContent.products) && parsedContent.products.length > 0) {
                // Show as comma-separated list since we don't have full data
                displayText = `I found these products: ${parsedContent.products.join(', ')}`
                console.log("[Message] Showing product titles as text")
            }
        }
    }

    // Render the message
    return (
        <div className="enox-msg enox-msg--bot">
            <div className="enox-msg-avatar" aria-hidden="true">✦</div>
            <div className="enox-msg-bubble">
                {isProductResponse ? (
                    matchedProducts && matchedProducts.length > 0 ? (
                        <ProductCards products={matchedProducts}/>
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
    if (!text) {
        return null
    }

    // Remove markdown code blocks if present
    const stripped = text
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim()

    try {
        const parsed = JSON.parse(stripped)
        if (parsed && typeof parsed === 'object') {
            const hasProducts = Array.isArray(parsed.products) && parsed.products.length > 0
            const hasProductData = Array.isArray(parsed.product_data) && parsed.product_data.length > 0

            if (hasProducts || hasProductData) {
                return parsed
            }
        }
    } catch (error) {
        // Not valid JSON
        console.log("[tryParseProductEnvelope] Not valid JSON")
    }
    return null
}