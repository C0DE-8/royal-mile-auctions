import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function HeroSlider({ slides }) {
  const [activeSlide, setActiveSlide] = useState(0)
  const activeContent = slides[activeSlide]

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length)
    }, 5200)

    return () => window.clearInterval(timer)
  }, [slides.length])

  return (
    <section className="hero-section" aria-label="Auction highlights">
      <div className="hero-slides">
        {slides.map((slide, index) => (
          slide.video ? (
            <video
              key={slide.title}
              className={index === activeSlide ? 'active' : undefined}
              poster={slide.image}
              autoPlay
              muted
              loop
              playsInline
              aria-label={slide.alt}
            >
              <source src={slide.video} type="video/mp4" />
            </video>
          ) : (
            <img
              key={slide.title}
              className={index === activeSlide ? 'active' : undefined}
              src={slide.image}
              alt={slide.alt}
            />
          )
        ))}
      </div>

      <div className={`hero-overlay ${activeContent.hideText ? 'actions-only' : ''}`}>
        {!activeContent.hideText && (
          <>
            <p className="eyebrow">{activeContent.eyebrow}</p>
            <h1>{activeContent.title}</h1>
            <p>{activeContent.copy}</p>
          </>
        )}
        <div className="action-row">
          <Link className="button primary" to="/inventory">
            View Run List
          </Link>
          <Link className="button secondary" to="/buyers">
            Buyer Policy
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="slider-controls" aria-label="Choose hero slide">
          {slides.map((slide, index) => (
            <button
              key={slide.title}
              type="button"
              className={index === activeSlide ? 'active' : undefined}
              aria-label={`Show slide ${index + 1}: ${slide.title}`}
              onClick={() => setActiveSlide(index)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default HeroSlider
