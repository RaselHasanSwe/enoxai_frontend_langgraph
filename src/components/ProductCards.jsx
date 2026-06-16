import { useState } from 'react'

/**
 * ProductCards.jsx
 *
 * Renders a single-product carousel with prev/next navigation.
 * Shows full product image, color swatches, size chips, price, rating.
 *
 * Props:
 *   products — array of full product objects from search_products tool
 */
export default function ProductCards({ products }) {
  const [index, setIndex] = useState(0)

  if (!products || products.length === 0) return null

  const total = products.length
  const product = products[index]

  function prev() {
    setIndex((i) => (i - 1 + total) % total)
  }

  function next() {
    setIndex((i) => (i + 1) % total)
  }

  return (
    <div className="enox-product-carousel">
      <ProductCard product={product} />

      {total > 1 && (
        <div className="enox-carousel-nav">
          <button
            className="enox-carousel-btn"
            onClick={prev}
            aria-label="Previous product"
          >
            ‹
          </button>
          <span className="enox-carousel-counter">
            {index + 1} / {total}
          </span>
          <button
            className="enox-carousel-btn"
            onClick={next}
            aria-label="Next product"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }) {
  const {
    product_name,
    product_url,
    product_image,
    price,
    currency = 'GBP',
    discount_price,
    has_discount,
    discount_percent,
    in_stock,
    rating,
    total_reviews,
    colors = [],
    sizes = [],
  } = product

  const symbol =
    currency === 'GBP' ? '£' :
    currency === 'USD' ? '$' :
    currency === 'EUR' ? '€' :
    currency

  return (
    <a
      className="enox-product-card enox-product-card--full"
      href={product_url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={product_name}
    >
      {/* Image */}
      <div className="enox-product-img-wrap enox-product-img-wrap--full">
        {product_image ? (
          <img
            className="enox-product-img"
            src={"https://images.enorsia.com/" + product_image + "/pgd"}
            alt={product_name}
            loading="lazy"
          />
        ) : (
          <div className="enox-product-img-placeholder">✦</div>
        )}

        {has_discount && discount_percent && (
          <span className="enox-product-badge">−{Math.round(discount_percent)}%</span>
        )}

        {!in_stock && (
          <div className="enox-product-oos">Out of stock</div>
        )}
      </div>

      {/* Info */}
      <div className="enox-product-info enox-product-info--full">
        <p className="enox-product-name enox-product-name--full">{product_name}</p>

        {/* Price */}
        <div className="enox-product-price-row">
          {has_discount && discount_price != null ? (
            <>
              <span className="enox-product-price enox-product-price--sale">
                {symbol}{Number(discount_price).toFixed(2)}
              </span>
              <span className="enox-product-price enox-product-price--original">
                {symbol}{Number(price).toFixed(2)}
              </span>
            </>
          ) : (
            <span className="enox-product-price">
              {symbol}{Number(price).toFixed(2)}
            </span>
          )}
        </div>

        {/* Rating */}
        {rating != null && (
          <div className="enox-product-rating">
            <span className="enox-product-stars">
              {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
            </span>
            {total_reviews != null && (
              <span className="enox-product-reviews">({total_reviews})</span>
            )}
          </div>
        )}

        {/* Color swatches */}
        {colors.length > 0 && (
          <div className="enox-product-section">
            <span className="enox-product-section-label">Colours</span>
            <div className="enox-product-colors enox-product-colors--full" aria-label="Available colours">
              {colors.map((c) => (
                <span
                  key={c}
                  className="enox-product-color-dot enox-product-color-dot--full"
                  title={c}
                  style={{ background: colorToHex(c) }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Size chips */}
        {sizes.length > 0 && (
          <div className="enox-product-section">
            <span className="enox-product-section-label">Sizes</span>
            <div className="enox-product-sizes enox-product-sizes--full" aria-label="Available sizes">
              {sizes.map((s) => (
                <span key={s} className="enox-product-size-chip">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </a>
  )
}

const COLOR_MAP = {
  black: '#111111', white: '#f5f5f5', red: '#e63030', pink: '#f472b6',
  rose: '#f43f5e', fuchsia: '#d946ef', purple: '#9333ea', violet: '#7c3aed',
  blue: '#2563eb', navy: '#1e3a5f', teal: '#0d9488', green: '#16a34a',
  olive: '#657234', yellow: '#eab308', orange: '#f97316', coral: '#ff6b6b',
  brown: '#92400e', camel: '#c19a6b', cream: '#fffdd0', beige: '#f5f0e8',
  ivory: '#fffff0', grey: '#9ca3af', gray: '#9ca3af', silver: '#c0c0c0',
  gold: '#d4af37', khaki: '#c3b091', nude: '#e8cdb2', lilac: '#c8a2c8',
  mint: '#98ead0', denim: '#1560bd', leopard: '#c68642', animal: '#c68642',
}

function colorToHex(name) {
  const key = name.toLowerCase().trim()
  return COLOR_MAP[key] || '#d1d5db'
}