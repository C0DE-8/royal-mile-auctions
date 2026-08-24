import { auctionSteps } from '../../data/siteData.js'

function AuctionsPage() {
  return (
    <section className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Online public sale</p>
        <h1>Online auto auctions built for verified buyers and sellers.</h1>
        <p>
          Bid online, win online, receive your document packet and key-release
          confirmation, then complete payment through a secure two-step checkout.
        </p>
      </div>

      <div className="info-layout">
        <article className="feature-panel reveal-card">
          <h2>Live Online Auction</h2>
          <p className="large-callout">Bid from anywhere</p>
          <ul className="check-list">
            <li>No dealer license required</li>
            <li>Verified buyer registration</li>
            <li>Vehicle photos, VIN details, and title notes</li>
            <li>Document packet sent after winning bid</li>
            <li>Auction fee first, then full vehicle payment</li>
          </ul>
        </article>

        <div className="step-stack">
          {auctionSteps.map((step, index) => (
            <article className="reveal-card" key={step.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default AuctionsPage
