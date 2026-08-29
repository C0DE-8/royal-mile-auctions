import { useEffect, useState } from 'react'
import auctionHero from '../../assets/auction-hero.png'
import auctionLane from '../../assets/auction-lane.png'
import auctionRegistration from '../../assets/auction-registration.png'
import { fetchAuctionItems } from '../../api/auctionItems.js'
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
    alt: 'Public auto auction lanes at sunset',
    eyebrow: 'Online public auto auction',
    title: 'Bid on verified vehicles from anywhere.',
    copy: 'A premium online auction experience with clear vehicle details, secure checkout, verified documents, and key-release confirmation.',
  },
  {
    image: auctionRegistration,
    alt: 'Auto auction buyers registering at the office counter',
    eyebrow: 'Verified buyer accounts',
    title: 'Register online before you place your first bid.',
    copy: 'Create an account, review the buyer terms, and get approved to compete for cars, trucks, SUVs, and fleet units.',
  },
  {
    image: auctionLane,
    alt: 'Vehicle entering a live auto auction lane',
    eyebrow: 'Secure winning-bid flow',
    title: 'Confirm documents and key release before final payment.',
    copy: 'Winning buyers receive the sale packet, invoice, and key-release confirmation before paying the full vehicle balance.',
  },
]

const discountRate = 0.6
const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const getAuctionPrice = (mainPrice) => Math.round(mainPrice * (1 - discountRate))

function HomePage() {
  const [auctionItems, setAuctionItems] = useState(featuredVehicles)
  const [loadError, setLoadError] = useState('')

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
        </div>
        <div className="vehicle-grid">
          {auctionItems.map((vehicle) => (
            <article
              className="vehicle-card reveal-card"
              key={`${vehicle.year}-${vehicle.lane}`}
            >
              <img
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
