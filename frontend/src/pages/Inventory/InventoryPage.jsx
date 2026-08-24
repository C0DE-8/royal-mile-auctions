import { featuredVehicles } from '../../data/siteData.js'

function InventoryPage() {
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
        <button type="button">All</button>
        <button type="button">Cars</button>
        <button type="button">Trucks</button>
        <button type="button">SUVs</button>
      </div>

      <div className="inventory-card-grid">
        {featuredVehicles.map((vehicle) => (
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
          <span role="columnheader">Miles</span>
          <span role="columnheader">Title</span>
          <span role="columnheader">Status</span>
        </div>
        {featuredVehicles.map((vehicle) => (
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
