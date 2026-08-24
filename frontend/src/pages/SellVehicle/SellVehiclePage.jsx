import { Link } from 'react-router-dom'

function SellVehiclePage() {
  return (
    <section className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Sell your vehicle</p>
        <h1>Put your car in front of active auction buyers this week.</h1>
        <p>
          Consign one vehicle or a whole fleet online. The auction team handles
          listing setup, bidder exposure, sale paperwork, and title processing.
        </p>
      </div>

      <div className="seller-layout">
        <article className="feature-panel reveal-card">
          <h2>Seller Intake</h2>
          <p>
            Send the VIN, mileage, title status, photos, pickup location, and
            expected reserve. We will confirm listing approval before the unit
            goes live.
          </p>
          <Link className="button primary" to="/contact">
            Start Consignment
          </Link>
        </article>
        <article className="reveal-card">
          <h2>What We Accept</h2>
          <ul className="check-list">
            <li>Public consignments</li>
            <li>Dealer trades</li>
            <li>Fleet vehicles</li>
            <li>Government and municipal units</li>
          </ul>
        </article>
      </div>
    </section>
  )
}

export default SellVehiclePage
