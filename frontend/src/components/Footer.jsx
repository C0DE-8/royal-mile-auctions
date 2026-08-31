import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <strong>Royal Mile Auctions</strong>
        <p>Where bidding meets dreams for online auto auction buyers across the United States.</p>
        <p>1280 Market Road, Wilmington, DE 19801</p>
      </div>
      <div className="footer-links" aria-label="Auction links">
        <strong>Auction Links</strong>
        <nav>
          <Link to="/inventory">Current Inventory</Link>
          <Link to="/bid">Bid Online</Link>
          <Link to="/buyers">Buyer Information</Link>
          <Link to="/sell">Sell Your Vehicle</Link>
          <Link to="/dashboard">Buyer Dashboard</Link>
          <Link to="/contact">Contact Support</Link>
        </nav>
      </div>
      <div className="footer-contact">
        <strong>Office</strong>
        <p>Bid online. Verify documents and key release before final payment.</p>
        <p>
          <a href="tel:+15126476269">+1 (512) 647-6269</a> ·{' '}
          <a href="mailto:info@royalmileauctions.com">info@royalmileauctions.com</a>
        </p>
      </div>
    </footer>
  )
}

export default Footer
