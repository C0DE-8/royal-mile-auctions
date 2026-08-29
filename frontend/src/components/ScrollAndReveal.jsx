import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function ScrollAndReveal() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  useEffect(() => {
    let observer
    let mutationObserver
    const observedCards = new WeakSet()
    const observeCards = () => {
      if (!observer) {
        return
      }

      document.querySelectorAll('.reveal-card').forEach((card) => {
        if (!observedCards.has(card)) {
          observedCards.add(card)
          observer.observe(card)
        }
      })
    }

    const frame = window.requestAnimationFrame(() => {
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

      observeCards()
      mutationObserver = new MutationObserver(observeCards)
      mutationObserver.observe(document.body, { childList: true, subtree: true })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      mutationObserver?.disconnect()
      observer?.disconnect()
    }
  }, [pathname])

  return null
}

export default ScrollAndReveal
