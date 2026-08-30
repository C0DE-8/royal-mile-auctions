import { useState } from 'react'
import loaderLogo from '../assets/logos/Royal-Mile-Auctions-loader.png'

function LazyImage({ alt, className = '', eager = false, src }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  return (
    <span className={`lazy-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'has-error' : ''} ${className}`}>
      <span className="lazy-image-placeholder" aria-hidden="true">
        <img src={loaderLogo} alt="" />
      </span>
      {src && !hasError && (
        <img
          className="lazy-image-main"
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={eager ? 'high' : 'auto'}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
    </span>
  )
}

export default LazyImage
