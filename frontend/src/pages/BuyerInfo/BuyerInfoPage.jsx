import { faqs } from '../../data/siteData.js'
import { Link } from 'react-router-dom'

function BuyerInfoPage() {
  return (
    <section className="page-shell">
      <div className="page-intro">
        <p className="eyebrow">Auction FAQ</p>
        <h1>Answers before you bid.</h1>
        <p>
          Understand online registration, bidding, document confirmation,
          key-release verification, auction fees, final payment, and delivery.
        </p>
        <div className="action-row">
          <Link className="button primary" to="/dashboard">Open buyer dashboard</Link>
          <Link className="button secondary" to="/inventory">Browse inventory</Link>
        </div>
      </div>

      <div className="policy-grid">
        <article className="reveal-card">
          <h2>Registration</h2>
          <ul className="check-list">
            <li>Create your online bidder account</li>
            <li>Submit accurate contact and identity details</li>
            <li>Review buyer terms before bidding</li>
            <li>Use current phone and email for document updates</li>
          </ul>
        </article>
        <article className="reveal-card">
          <h2>Before You Bid</h2>
          <ul className="check-list">
            <li>Review vehicle photos and condition notes</li>
            <li>Check VIN, mileage, title status, and seller notes</li>
            <li>Confirm buyer fee and final payment requirements</li>
            <li>Set your maximum bid before the auction closes</li>
          </ul>
        </article>
        <article className="reveal-card">
          <h2>Win Verification</h2>
          <ul className="check-list">
            <li>Receive winning-bid confirmation</li>
            <li>Receive vehicle document packet</li>
            <li>Confirm key-release details</li>
            <li>Review the invoice before payment</li>
          </ul>
        </article>
        <article className="reveal-card">
          <h2>Secure Payment</h2>
          <ul className="check-list">
            <li>Pay auction fee to secure the vehicle</li>
            <li>Confirm documents and key release</li>
            <li>Pay full vehicle balance</li>
            <li>Schedule pickup or delivery after clearance</li>
          </ul>
        </article>
      </div>

      <section className="auction-rules reveal-card">
        <p className="eyebrow">Buyer protection flow</p>
        <h2>Documents first, fee second, full balance after confirmation.</h2>
        <p>
          Our checkout flow is built to give buyers confidence. After a winning
          bid is verified, the document packet and key-release confirmation are
          issued to the buyer. The buyer then pays the auction fee to secure the
          sale, reviews the final invoice, and pays the remaining vehicle
          balance through approved payment instructions.
        </p>
      </section>

      <section className="auction-rules reveal-card">
        <p className="eyebrow">Bidding and payment flow</p>
        <h2>Your dashboard keeps the sale process in one place.</h2>
        <div className="flow-grid">
          <article>
            <strong>1</strong>
            <h3>Choose a vehicle</h3>
            <p>Open the run list, review price, title status, VIN, lane, lot, and seller notes.</p>
          </article>
          <article>
            <strong>2</strong>
            <h3>Place your bid</h3>
            <p>Sign in to the buyer dashboard and submit the amount you want reviewed by the auction team.</p>
          </article>
          <article>
            <strong>3</strong>
            <h3>Submit payment info</h3>
            <p>Select an approved wallet, scan the QR code, and submit transaction details for review.</p>
          </article>
          <article>
            <strong>4</strong>
            <h3>Track status</h3>
            <p>Your dashboard lists your bid items and payment records while the team verifies the sale.</p>
          </article>
        </div>
      </section>

      <div className="faq-list full">
        {faqs.map((faq) => (
          <details className="reveal-card" key={faq.question}>
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export default BuyerInfoPage
