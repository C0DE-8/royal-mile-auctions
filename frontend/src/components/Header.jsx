import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import brandLogo from '../assets/logos/Royal-Mile-Auctions-logo.png'
import { navItems } from '../data/siteData.js'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className={isMenuOpen ? 'site-header menu-open' : 'site-header'}>
      <Link className="brand" to="/" aria-label="Royal Mile Auctions home" onClick={closeMenu}>
        <img className="brand-logo" src={brandLogo} alt="" />
        <span className="brand-copy">
          <strong>Royal Mile Auctions</strong>
          <small>Online Auto Auction</small>
        </span>
      </Link>

      <button
        className="menu-toggle"
        type="button"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={isMenuOpen}
        aria-controls="primary-navigation"
        onClick={() => setIsMenuOpen((current) => !current)}
      >
        <span />
        <span />
        <span />
      </button>

      <nav className="primary-nav" id="primary-navigation" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.route}
            to={item.path}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
            end={item.path === '/'}
            onClick={closeMenu}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Link className="header-action" to="/inventory" onClick={closeMenu}>
        Run List
      </Link>
    </header>
  )
}

export default Header
