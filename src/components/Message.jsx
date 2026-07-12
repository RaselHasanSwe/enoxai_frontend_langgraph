import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import ProductCards from './ProductCards'
import { parseAssistantMessage } from '../utils/parseMessageContent'

export default function Message({ role, content, imageUrl, products, streaming }) {
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

    if (streaming) {
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

    const normalized = parseAssistantMessage(content, products)
    const displayText = normalized.content?.trim() || ''
    const matchedProducts = normalized.products || []
    const showProductCards = matchedProducts.length > 0
    const hasDisplayText = Boolean(displayText)

    const preserveLineBreaks = (text) => {
        if (!text) return '▋'
        return text.replace(/\n\n/g, '\n\n').replace(/\n/g, '  \n')
    }

    return (
        <div className="enox-msg enox-msg--bot">
            <div className="enox-msg-avatar" aria-hidden="true">✦</div>
            <div className="enox-msg-bubble">
                {hasDisplayText && (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                        {preserveLineBreaks(displayText)}
                    </ReactMarkdown>
                )}
                {showProductCards ? (
                    <ProductCards products={matchedProducts} />
                ) : !hasDisplayText ? (
                    <span>Sorry, I couldn't find those products right now.</span>
                ) : null}
            </div>
        </div>
    )
}
