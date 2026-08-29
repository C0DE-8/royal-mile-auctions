import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAuctionItem } from '../../api/auctionItems.js'
import { featuredVehicles } from '../../data/siteData.js'

const discountRate = 0.6
const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const getAuctionPrice = (vehicle) => {
  if (vehicle.auctionPrice) {
    return vehicle.auctionPrice
  }

  const discountPercent = vehicle.discountPercent ?? discountRate * 100
  return Math.round(vehicle.mainPrice * (1 - discountPercent / 100))
}

const getFallbackVehicle = (id) =>
  featuredVehicles.find((vehicle) => String(vehicle.id) === String(id) || String(vehicle.lot) === String(id))

function VehicleDetailPage() {
  const { id } = useParams()
  const fallbackVehicle = useMemo(() => getFallbackVehicle(id), [id])
  const [fetchedVehicle, setFetchedVehicle] = useState(null)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let isMounted = true

    fetchAuctionItem(id)
      .then((item) => {
        if (isMounted) {
          setFetchedVehicle({ id, item })
          setLoadError(null)
        }
      })
      .catch(() => {
        if (isMounted && !fallbackVehicle) {
          setLoadError({ id, message: 'Vehicle details are unavailable right now.' })
        }
      })

    return () => {
      isMounted = false
    }
  }, [fallbackVehicle, id])

  const vehicle = fetchedVehicle?.id === id ? fetchedVehicle.item : fallbackVehicle
  const errorMessage = loadError?.id === id ? loadError.message : ''

  if (!vehicle) {
    return (
      <section className="page-shell not-found">
        <div>
          <p className="eyebrow">Vehicle not found</p>
          <h1>This listing is not available.</h1>
          <Link className="button primary" to="/inventory">
            Back to inventory
          </Link>
        </div>
      </section>
    )
  }

  const images = vehicle.images?.length ? vehicle.images : [vehicle.image].filter(Boolean)
  const safeImageIndex = Math.min(activeImageIndex, Math.max(images.length - 1, 0))
  const activeImage = images[safeImageIndex] || vehicle.image
  const auctionPrice = getAuctionPrice(vehicle)
  const discountPercent = vehicle.discountPercent ?? 60
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const detailSpecs = [
    ['Mileage', vehicle.miles],
    ['VIN', vehicle.vin],
    ['Title', vehicle.title],
    ['Light', vehicle.light],
    ['Seller', vehicle.seller],
    ['Status', vehicle.status],
    ['Transmission', vehicle.transmission],
    ['Drivetrain', vehicle.drivetrain],
  ]

  return (
    <section className="page-shell vehicle-detail-shell">
      <Link className="back-link" to="/inventory">
        Back to inventory
      </Link>

      {errorMessage && <p className="inventory-notice">{errorMessage}</p>}

      <div className="vehicle-detail-layout">
        <div className="vehicle-gallery">
          <div className="vehicle-hero-image">
            <img src={activeImage} alt={vehicleName} />
          </div>
          <div className="vehicle-thumbnails" aria-label="Vehicle photos">
            {images.map((image, index) => (
              <button
                className={safeImageIndex === index ? 'active' : undefined}
                type="button"
                key={`${image}-${index}`}
                aria-label={`Show vehicle photo ${index + 1}`}
                aria-pressed={safeImageIndex === index}
                onClick={() => setActiveImageIndex(index)}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>

        <aside className="vehicle-detail-panel">
          <div className="listing-card-topline">
            <span>Lane {vehicle.lane}</span>
            <span>Lot {vehicle.lot}</span>
            <span>{vehicle.category}</span>
          </div>
          <h1>{vehicleName}</h1>
          <p>{vehicle.notes}</p>
          <div className="price-panel vehicle-price-panel" aria-label="Auction pricing">
            <span className="discount-badge">{discountPercent}% off</span>
            <strong>{priceFormatter.format(auctionPrice)}</strong>
            <span>
              Main price <s>{priceFormatter.format(vehicle.mainPrice)}</s>
            </span>
          </div>
          <div className="vehicle-detail-actions">
            <Link className="button primary" to="/dashboard">
              Bid / Pay
            </Link>
            <Link className="button secondary dark" to="/contact">
              Ask about this car
            </Link>
          </div>
        </aside>
      </div>

      <div className="vehicle-detail-grid">
        <section className="vehicle-detail-card">
          <h2>Vehicle information</h2>
          <dl className="detail-specs">
            {detailSpecs.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="vehicle-detail-card">
          <h2>Sale notes</h2>
          <ul className="check-list detail-check-list">
            <li>Review VIN, title status, seller notes, and mileage before bidding.</li>
            <li>Winning buyers receive document and key-release confirmation.</li>
            <li>Payment is completed through the buyer dashboard after the auction fee.</li>
          </ul>
        </section>
      </div>
    </section>
  )
}

export default VehicleDetailPage
