import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import auctionHero from '../../assets/auction-hero.png'
import heroVideo from '../../assets/hero-vid.mp4'
import bentleySlide from '../../assets/slides/Bentley_Continental.png'
import challengerSlide from '../../assets/slides/Dodge_Challenger.png'
import fordGtSlide from '../../assets/slides/Ford_GT.png'
import murcielagoSlide from '../../assets/slides/Lamborghini_Murcielago.png'
import packardSlide from '../../assets/slides/Packard_Twelve.png'
import porscheSlide from '../../assets/slides/Porsche_911.png'
import ramSlide from '../../assets/slides/Ram_1500.png'
import charlesStory from '../../assets/stories/Charles.png'
import daronStory from '../../assets/stories/Daron.png'
import joshStory from '../../assets/stories/Josh.png'
import mattStory from '../../assets/stories/Matt.png'
import morganStory from '../../assets/stories/Morgan.png'
import ryanStory from '../../assets/stories/Ryan.png'
import { fetchAuctionItems } from '../../api/auctionItems.js'
import LazyImage from '../../components/LazyImage.jsx'
import {
  auctionStats,
  auctionSteps,
  faqs,
  featuredVehicles,
} from '../../data/siteData.js'
import HeroSlider from './HeroSlider.jsx'

const heroSlides = [
  {
    image: auctionHero,
    video: heroVideo,
    alt: 'Public auto auction lanes at sunset',
    eyebrow: 'Online public auto auction',
    title: 'Bid on verified vehicles from anywhere.',
    copy: 'A premium online auction experience with clear vehicle details, secure checkout, verified documents, and key-release confirmation.',
    hideText: true,
  },
]

const discountRate = 0.6
const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const getAuctionPrice = (mainPrice) => Math.round(mainPrice * (1 - discountRate))

const customCarSlides = [
  {
    image: ramSlide,
    eyebrow: 'Custom truck',
    title: 'Ram 1500',
    copy: 'HHP 426ci Behemoth Long Block Stroker HEMI V8',
  },
  {
    image: porscheSlide,
    eyebrow: 'Performance coupe',
    title: 'Porsche 911',
    copy: 'Turbocharged precision with a refined auction-ready presentation',
  },
  {
    image: murcielagoSlide,
    eyebrow: 'Exotic supercar',
    title: 'Lamborghini Murcielago',
    copy: 'Italian V12 presence with low-slung collector appeal',
  },
  {
    image: bentleySlide,
    eyebrow: 'Grand touring',
    title: 'Bentley Continental',
    copy: 'Luxury touring cabin, polished road presence, premium finish',
  },
  {
    image: fordGtSlide,
    eyebrow: 'American icon',
    title: 'Ford GT',
    copy: 'Track-bred design with collector-grade performance styling',
  },
  {
    image: challengerSlide,
    eyebrow: 'Muscle car',
    title: 'Dodge Challenger',
    copy: 'Wide stance, V8 attitude, and modern street performance',
  },
  {
    image: packardSlide,
    eyebrow: 'Classic collectible',
    title: 'Packard Twelve',
    copy: 'Pre-war elegance with rare luxury collector character',
  },
]

const customerStories = [
  {
    name: 'Charles',
    image: charlesStory,
    vehicle: 'Mercedes-Benz G-Class',
    quote: 'The listing had the photos and title notes I needed before placing a serious bid.',
  },
  {
    name: 'Morgan',
    image: morganStory,
    vehicle: 'Porsche 911',
    quote: 'The online bid flow was simple, and the document confirmation made the purchase feel organized.',
  },
  {
    name: 'Ryan',
    image: ryanStory,
    vehicle: 'Ferrari Roma',
    quote: 'I could compare inventory fast and follow the auction without calling the office every hour.',
  },
  {
    name: 'Daron',
    image: daronStory,
    vehicle: 'Lamborghini Urus',
    quote: 'The vehicle detail page gave me enough confidence to bid from out of state.',
  },
  {
    name: 'Josh',
    image: joshStory,
    vehicle: 'Ford F-150',
    quote: 'Payment steps were clear after winning, and the dashboard kept everything in one place.',
  },
  {
    name: 'Matt',
    image: mattStory,
    vehicle: 'Cadillac XLR',
    quote: 'The auction price, photos, and sale notes were easy to scan before I made my move.',
  },
]

function HomePage() {
  const [auctionItems, setAuctionItems] = useState(featuredVehicles)
  const [activeCustomSlide, setActiveCustomSlide] = useState(0)
  const [loadError, setLoadError] = useState('')
  const activeSlide = customCarSlides[activeCustomSlide]

  useEffect(() => {
    let isMounted = true

    fetchAuctionItems()
      .then((items) => {
        if (isMounted) {
          setAuctionItems(items.slice(0, 4))
          setLoadError('')
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuctionItems(featuredVehicles)
          setLoadError('Showing sample vehicles because live inventory is unavailable.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveCustomSlide((current) => (current + 1) % customCarSlides.length)
    }, 5600)

    return () => window.clearInterval(timer)
  }, [])

  return (
    <>
      <HeroSlider slides={heroSlides} />

      <section className="stats-band" aria-label="Auction highlights">
        {auctionStats.map((stat) => (
          <div className="reveal-card" key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="section-grid">
        <div className="section-copy">
          <p className="eyebrow">This week's sale</p>
          <h2>Preview, compare, and bid with confidence.</h2>
          <p>
            We designed the site around what online buyers need first: clear
            photos, VIN details, title status, fees, seller notes, document
            confirmation, and secure payment steps.
          </p>
          {loadError && <p className="site-alert warning">{loadError}</p>}
          <Link className="button primary" to="/inventory">
            View full inventory
          </Link>
        </div>
        <div className="vehicle-grid">
          {auctionItems.map((vehicle) => (
            <article
              className="vehicle-card reveal-card"
              key={`${vehicle.year}-${vehicle.lane}`}
            >
              <LazyImage
                className="vehicle-card-image"
                src={vehicle.image}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />
              <span>{vehicle.lane}</span>
              <h3>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              <div className="price-panel compact" aria-label="Auction pricing">
                <span className="discount-badge">60% off</span>
                <strong>{priceFormatter.format(getAuctionPrice(vehicle.mainPrice))}</strong>
                <span>
                  Main price <s>{priceFormatter.format(vehicle.mainPrice)}</s>
                </span>
              </div>
              <p>{vehicle.miles}</p>
              <dl>
                <div>
                  <dt>Title</dt>
                  <dd>{vehicle.title}</dd>
                </div>
                <div>
                  <dt>Status</dt>
                  <dd>{vehicle.light}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="showroom-section">
        <div className="showroom-stage">
          <div className="showroom-vehicle-media" key={activeSlide.title}>
            <LazyImage
              className="showroom-main-image"
              src={activeSlide.image}
              alt={activeSlide.title}
            />
          </div>
          <article className="showroom-copy" key={`${activeSlide.title}-copy`}>
            <span>{activeSlide.eyebrow}</span>
            <h3>{activeSlide.title}</h3>
            <p>{activeSlide.copy}</p>
          </article>
        </div>

        <div className="showroom-controls" aria-label="Choose featured vehicle">
          {customCarSlides.map((vehicle, index) => (
            <button
              key={vehicle.title}
              type="button"
              className={activeCustomSlide === index ? 'active' : undefined}
              aria-label={`Show slide ${index + 1}`}
              onClick={() => setActiveCustomSlide(index)}
            />
          ))}
        </div>
      </section>

      <section className="process-band">
        <div className="section-heading">
          <p className="eyebrow">Simple process</p>
          <h2>Four steps from account approval to vehicle release.</h2>
        </div>
        <div className="step-list">
          {auctionSteps.map((step, index) => (
            <article className="reveal-card" key={step.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="customer-stories-section">
        <div className="section-heading">
          <p className="eyebrow">Customer stories</p>
          <h2>Buyers who found the right lane online.</h2>
        </div>
        <div className="customer-story-grid">
          {customerStories.map((story) => (
            <article className="customer-story-card reveal-card" key={story.name}>
              <LazyImage
                className="customer-story-image"
                src={story.image}
                alt={`${story.name} customer story`}
              />
              <div>
                <strong>{story.name}</strong>
                <span>{story.vehicle}</span>
                <p>{story.quote}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="faq-section">
        <div className="section-heading">
          <p className="eyebrow">Auction FAQ</p>
          <h2>Know the lane rules before you raise your hand.</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details className="reveal-card" key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}

export default HomePage
