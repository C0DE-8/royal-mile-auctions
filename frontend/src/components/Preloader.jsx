import { useEffect, useState } from 'react'

function Preloader() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(false)
    }, 950)

    return () => window.clearTimeout(timer)
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="preloader" role="status" aria-label="Loading auction site">
      <div className="preloader-mark">
        <img src="/brand-mark.svg" alt="" />
      </div>
      <div className="preloader-copy">
        <strong>Metro Auto Exchange</strong>
        <span>Preparing the auction floor</span>
      </div>
    </div>
  )
}

export default Preloader
