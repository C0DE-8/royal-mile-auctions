import { useEffect, useState } from 'react'
import { fetchAuctionItems } from '../../api/auctionItems.js'
import { featuredVehicles } from '../../data/siteData.js'

const inventoryTabs = ['All', 'Cars', 'Trucks', 'SUVs']
const discountRate = 0.6
const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const getAuctionPrice = (mainPrice) => Math.round(mainPrice * (1 - discountRate))

function InventoryPage() {
  const [activeTab, setActiveTab] = useState('All')
  const [auctionItems, setAuctionItems] = useState(featuredVehicles)
  const [loadError, setLoadError] = useState('')
  const visibleVehicles =
    activeTab === 'All'
      ? auctionItems
      : auctionItems.filter((vehicle) => vehicle.category === activeTab)

  useEffect(() => {
    let isMounted = true

    fetchAuctionItems()
      .then((items) => {
        if (isMounted) {
          setAuctionItems(items)
          setLoadError('')
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError('Showing sample inventory because the backend is unavailable.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section className="page-shell">
      <div className="page-intro compact">
        <p className="eyebrow">Pre-sale run list</p>
        <h1>Photo-first inventory for this week's auction.</h1>
        <p>
          Browse lane assignments, title status, seller source, drivetrain, and
          condition notes before you walk the yard.
        </p>
      </div>

      <div className="inventory-toolbar">
        {inventoryTabs.map((tab) => (
          <button
            className={activeTab === tab ? 'active' : undefined}
            type="button"
            aria-pressed={activeTab === tab}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {loadError && <p className="inventory-notice">{loadError}</p>}

      <div className="inventory-card-grid">
        {visibleVehicles.map((vehicle) => (
          <article className="listing-card reveal-card" key={vehicle.id}>
            <img
              src={vehicle.image}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            />
            <div className="listing-card-body">
              <div className="listing-card-topline">
                <span>Lane {vehicle.lane}</span>
                <span>Lot {vehicle.lot}</span>
              </div>
              <h2>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h2>
              <div className="price-panel" aria-label="Auction pricing">
                <span className="discount-badge">60% off</span>
                <strong>{priceFormatter.format(getAuctionPrice(vehicle.mainPrice))}</strong>
                <span>
                  Main price <s>{priceFormatter.format(vehicle.mainPrice)}</s>
                </span>
              </div>
              <p>{vehicle.notes}</p>
              <dl className="listing-specs">
                <div>
                  <dt>Miles</dt>
                  <dd>{vehicle.miles}</dd>
                </div>
                <div>
                  <dt>Title</dt>
                  <dd>{vehicle.title}</dd>
                </div>
                <div>
                  <dt>Light</dt>
                  <dd>{vehicle.light}</dd>
                </div>
                <div>
                  <dt>Seller</dt>
                  <dd>{vehicle.seller}</dd>
                </div>
                <div>
                  <dt>Drive</dt>
                  <dd>{vehicle.drivetrain}</dd>
                </div>
                <div>
                  <dt>VIN</dt>
                  <dd>{vehicle.vin}</dd>
                </div>
              </dl>
            </div>
          </article>
        ))}
      </div>

      <div className="inventory-table" role="table" aria-label="Auction inventory">
        <div className="table-row table-head" role="row">
          <span role="columnheader">Photo</span>
          <span role="columnheader">Lane</span>
          <span role="columnheader">Lot</span>
          <span role="columnheader">Vehicle</span>
          <span role="columnheader">Auction Price</span>
          <span role="columnheader">Miles</span>
          <span role="columnheader">Title</span>
          <span role="columnheader">Status</span>
        </div>
        {visibleVehicles.map((vehicle) => (
          <div className="table-row reveal-card" role="row" key={vehicle.lane}>
            <span role="cell">
              <img
                className="table-thumb"
                src={vehicle.image}
                alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />
            </span>
            <span role="cell">{vehicle.lane}</span>
            <span role="cell">{vehicle.lot}</span>
            <span role="cell">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
            <span role="cell" className="table-price">
              <strong>{priceFormatter.format(getAuctionPrice(vehicle.mainPrice))}</strong>
              <small>60% off {priceFormatter.format(vehicle.mainPrice)}</small>
            </span>
            <span role="cell">{vehicle.miles}</span>
            <span role="cell">{vehicle.title}</span>
            <span role="cell">{vehicle.light}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default InventoryPage
