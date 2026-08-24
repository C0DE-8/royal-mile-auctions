import { faqs } from '../../data/siteData.js'

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
