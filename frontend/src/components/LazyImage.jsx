import { useState } from 'react'
import brandLogo from '../assets/logos/Royal-Mile-Auctions-logo.png'

function LazyImage({ alt, className = '', eager = false, src }) {
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <span className={`lazy-image ${isLoaded ? 'loaded' : ''} ${className}`}>
      <span className="lazy-image-placeholder" aria-hidden="true">
        <img src={brandLogo} alt="" />
      </span>
      {src && (
        <img
          className="lazy-image-main"
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </span>
  )
}

export default LazyImage
