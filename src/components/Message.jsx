import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw';
import ProductCards from './ProductCards'

export default function Message({role, content, imageUrl, products, streaming}) {
    const isUser = role === 'user'

    if (isUser) {
        return (
            <div className="enox-msg enox-msg--user">
                <div className="enox-msg-bubble">
                    {imageUrl && (
                        <img
                            className="enox-msg-image"
                            src={imageUrl}
                            alt="Uploaded attachment"
                        />
                    )}
                    {content?.trim() && <span>{content}</span>}
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

    let displayText = content?.trim() || ''
    let matchedProducts = []
    let showProductCards = false
    let isStructuredProductTurn = false

    // Live stream / history: products prop was set explicitly
    if (products !== undefined && products !== null) {
        isStructuredProductTurn = true
        matchedProducts = Array.isArray(products)
            ? products.filter(p => p && typeof p === 'object' && p.product_name)
            : []
        showProductCards = matchedProducts.length > 0
    } else if (content) {
        // History fallback: parse stored JSON envelope
        const parsedContent = tryParseProductEnvelope(content)
        if (parsedContent) {
            if (parsedContent.message && typeof parsedContent.message === 'string') {
                displayText = parsedContent.message.trim()
            }
            if (parsedContent.product_data && Array.isArray(parsedContent.product_data) && parsedContent.product_data.length > 0) {
                matchedProducts = parsedContent.product_data
                showProductCards = true
                isStructuredProductTurn = true
            } else if (parsedContent.products && Array.isArray(parsedContent.products) && parsedContent.products.length > 0) {
                displayText = displayText || `I found these products: ${parsedContent.products.join(', ')}`
            }
        }
    }

    const hasDisplayText = Boolean(displayText)

    const preserveLineBreaks = (text) => {
        if (!text) return '▋';
        return text.replace(/\n\n/g, '\n\n').replace(/\n/g, '  \n');
    };

    // Render the message
    return (
        <div className="enox-msg enox-msg--bot">
            <div className="enox-msg-avatar" aria-hidden="true">✦</div>
            <div className="enox-msg-bubble">
                {isStructuredProductTurn ? (
                    <>
                        {hasDisplayText && (
                            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                                {preserveLineBreaks(displayText)}
                            </ReactMarkdown>
                        )}
                        {showProductCards ? (
                            <ProductCards products={matchedProducts}/>
                        ) : !hasDisplayText ? (
                            <span>Sorry, I couldn't find those products right now.</span>
                        ) : null}
                    </>
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {preserveLineBreaks(displayText)}
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