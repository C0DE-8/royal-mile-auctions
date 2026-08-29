import { Link, NavLink } from 'react-router-dom'
import { navItems } from '../data/siteData.js'

function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Royal Mile Auctions home">
        <img className="brand-logo" src="/favicon.png" alt="" />
        <span className="brand-copy">
          <strong>Royal Mile Auctions</strong>
          <small>Online Auto Auction</small>
        </span>
      </Link>

      <nav className="primary-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.route}
            to={item.path}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            end={item.path === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Link className="header-action" to="/inventory">
        Run List
      </Link>
    </header>
  )
}

export default Header
