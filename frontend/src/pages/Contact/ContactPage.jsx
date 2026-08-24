function ContactPage() {
  return (
    <section className="page-shell">
      <div className="page-intro compact">
        <p className="eyebrow">Support</p>
        <h1>Get help with bidding, documents, payment, and release.</h1>
      </div>

      <div className="contact-grid">
        <article className="reveal-card">
          <h2>Vehicle Yard</h2>
          <p>1280 Market Road</p>
          <p>Wilmington, DE 19801</p>
          <a className="button secondary" href="https://maps.google.com" target="_blank">
            Open Map
          </a>
        </article>
        <article className="reveal-card">
          <h2>Support Hours</h2>
          <dl className="hours-list">
            <div>
              <dt>Monday</dt>
              <dd>Closed</dd>
            </div>
            <div>
              <dt>Tuesday - Wednesday</dt>
              <dd>9 AM - 5 PM</dd>
            </div>
            <div>
              <dt>Thursday</dt>
              <dd>9 AM - 10 PM</dd>
            </div>
            <div>
              <dt>Friday</dt>
              <dd>8 AM - 1 PM</dd>
            </div>
          </dl>
        </article>
        <article className="reveal-card">
          <h2>Buyer Desk</h2>
          <p>(302) 555-0188</p>
          <p>buyers@metroauto.example</p>
          <a className="button primary" href="tel:+13025550188">
            Call Office
          </a>
        </article>
      </div>
    </section>
  )
}

export default ContactPage
