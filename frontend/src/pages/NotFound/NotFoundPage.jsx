import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="page-shell not-found">
      <div className="page-intro compact">
        <p className="eyebrow">404</p>
        <h1>This lane is closed.</h1>
        <p>
          The page you requested does not exist. Head back to the current run
          list or return to the auction homepage.
        </p>
        <div className="action-row">
          <Link className="button primary" to="/inventory">
            View Run List
          </Link>
          <Link className="button secondary dark" to="/">
            Back Home
          </Link>
        </div>
      </div>
    </section>
  )
}

export default NotFoundPage
