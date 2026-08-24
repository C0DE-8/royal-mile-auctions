import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollAndReveal() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  useEffect(() => {
    let observer
    const frame = window.requestAnimationFrame(() => {
      const cards = document.querySelectorAll('.reveal-card')
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              observer.unobserve(entry.target)
            }
          })
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
      )

      cards.forEach((card) => observer.observe(card))
    })

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [pathname])

  return null
}

export default ScrollAndReveal
