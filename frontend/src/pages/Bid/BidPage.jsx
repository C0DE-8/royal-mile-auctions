import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchAuctionItem, fetchAuctionItems } from '../../api/auctionItems.js'
import { Alert } from '../../components/Feedback.jsx'
import LazyImage from '../../components/LazyImage.jsx'
import {
  buyerLogin,
  buyerRegister,
  createBid,
  fetchAuctionItemBids,
} from '../../api/buyer.js'
import { featuredVehicles } from '../../data/siteData.js'

const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})
const minimumBidIncrement = 100
const defaultDiscountPercent = 60

function getOpeningBid(item) {
  if (!item) {
    return minimumBidIncrement
  }

  if (item.auctionPrice) {
    return Number(item.auctionPrice)
  }

  return Math.round(Number(item.mainPrice || 0) * (1 - Number(item.discountPercent ?? defaultDiscountPercent) / 100))
}

const defaultLogin = {
  email: 'info@royalmileauctions.com',
  password: 'UserPass123!',
}

const defaultRegister = {
  name: '',
  email: '',
  password: '',
  phone: '',
}

function readBuyerAuth() {
  try {
    return JSON.parse(localStorage.getItem('buyerAuth')) || null
  } catch {
    return null
  }
}

function saveBuyerAuth(auth) {
  localStorage.setItem('buyerAuth', JSON.stringify(auth))
  localStorage.setItem('token', auth.token)
}

function BidPage() {
  const { id } = useParams()
  const [auth, setAuth] = useState(() => readBuyerAuth())
  const [mode, setMode] = useState('login')
  const [login, setLogin] = useState(defaultLogin)
  const [register, setRegister] = useState(defaultRegister)
  const [items, setItems] = useState(featuredVehicles)
  const [selectedItemId, setSelectedItemId] = useState(id || featuredVehicles[0]?.id || '')
  const [selectedItem, setSelectedItem] = useState(null)
  const [bidAmount, setBidAmount] = useState('')
  const [itemBids, setItemBids] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingItem, setIsLoadingItem] = useState(true)

  const currentHighBid = useMemo(
    () => itemBids.reduce((highest, bid) => Math.max(highest, Number(bid.amount || 0)), 0),
    [itemBids],
  )
  const buyerLastBid = useMemo(
    () => itemBids
      .filter((bid) => bid.is_current_user)
      .reduce((highest, bid) => Math.max(highest, Number(bid.amount || 0)), 0),
    [itemBids],
  )
  const openingBid = getOpeningBid(selectedItem)
  const minimumNextBid = currentHighBid > 0 ? currentHighBid + minimumBidIncrement : openingBid
  const suggestedBid = Math.max(minimumNextBid, buyerLastBid + minimumBidIncrement)

  useEffect(() => {
    fetchAuctionItems()
      .then((nextItems) => {
        setItems(nextItems)
        if (!id && nextItems[0]) {
          setSelectedItemId(nextItems[0].id)
        }
      })
      .catch(() => setItems(featuredVehicles))
  }, [id])

  useEffect(() => {
    let isMounted = true

    fetchAuctionItem(selectedItemId)
      .then((item) => {
        if (isMounted) {
          setSelectedItem(item)
          setError('')
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          const fallback = items.find((item) => String(item.id) === String(selectedItemId))
          setSelectedItem(fallback || null)
          if (!fallback) {
            setError(nextError.message)
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingItem(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [items, selectedItemId])

  useEffect(() => {
    if (!auth?.token || !selectedItemId) {
      return
    }

    fetchAuctionItemBids(auth.token, selectedItemId)
      .then(setItemBids)
      .catch((nextError) => setError(nextError.message))
  }, [auth, selectedItemId])

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      const nextAuth = await buyerLogin(login.email, login.password)
      saveBuyerAuth(nextAuth)
      setAuth(nextAuth)
      setMessage(`Signed in as ${nextAuth.user.name}.`)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRegister = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      const nextAuth = await buyerRegister(register)
      saveBuyerAuth(nextAuth)
      setAuth(nextAuth)
      setRegister(defaultRegister)
      setMessage(`Buyer account created for ${nextAuth.user.name}.`)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBid = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      const amount = Number(bidAmount)
      if (!Number.isFinite(amount) || amount < minimumNextBid) {
        setError(`Bid must be at least ${priceFormatter.format(minimumNextBid)}.`)
        return
      }

      await createBid(auth.token, selectedItemId, bidAmount)
      setItemBids(await fetchAuctionItemBids(auth.token, selectedItemId))
      setBidAmount('')
      setMessage('Bid submitted.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const signOut = () => {
    localStorage.removeItem('buyerAuth')
    localStorage.removeItem('token')
    setAuth(null)
    setItemBids([])
  }

  return (
    <section className="page-shell dashboard-shell">
      <div className="admin-dashboard-head">
        <div className="page-intro compact">
          <p className="eyebrow">Bid page</p>
          <h1>Place a bid on a vehicle.</h1>
          <p>Review the listing and current bid activity before submitting your amount.</p>
        </div>
        <Link className="button secondary dark" to="/dashboard">Dashboard</Link>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      <div className="bid-page-layout">
        <section className="admin-panel admin-form">
          <div className="admin-section-head">
            <span>Vehicle</span>
            <h2>Choose car</h2>
          </div>
          <label className="full">
            Auction item
            <select value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.year} {item.make} {item.model} - Lot {item.lot}
                </option>
              ))}
            </select>
          </label>

          {isLoadingItem ? (
            <div className="detail-skeleton full">
              <span />
              <span />
              <span />
            </div>
          ) : selectedItem && (
            <article className="buyer-selected-item full">
              <LazyImage src={selectedItem.image} alt={`${selectedItem.year} ${selectedItem.make} ${selectedItem.model}`} />
              <div>
                <strong>{selectedItem.year} {selectedItem.make} {selectedItem.model}</strong>
                <span>Lane {selectedItem.lane} | Lot {selectedItem.lot} | {selectedItem.miles}</span>
                <Link className="table-action" to={`/inventory/${selectedItem.id}`}>View details</Link>
              </div>
            </article>
          )}
        </section>

        <section className="admin-panel admin-form">
          <div className="admin-section-head">
            <span>{auth ? `Signed in as ${auth.user.name}` : 'Buyer access'}</span>
            <h2>{auth ? 'Submit bid' : mode === 'login' ? 'Sign in' : 'Register'}</h2>
          </div>

          {!auth && (
            <>
              <div className="dashboard-tabs full">
                <button className={mode === 'login' ? 'active' : undefined} type="button" onClick={() => setMode('login')}>Sign in</button>
                <button className={mode === 'register' ? 'active' : undefined} type="button" onClick={() => setMode('register')}>Register</button>
              </div>
              {mode === 'login' ? (
                <>
                  <label className="full">Email<input type="email" value={login.email} onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))} required /></label>
                  <label className="full">Password<input type="password" value={login.password} onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))} required /></label>
                  <button className="button primary" type="button" disabled={isSubmitting} onClick={handleLogin}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
                </>
              ) : (
                <>
                  <label className="full">Name<input value={register.name} onChange={(event) => setRegister((current) => ({ ...current, name: event.target.value }))} required /></label>
                  <label className="full">Email<input type="email" value={register.email} onChange={(event) => setRegister((current) => ({ ...current, email: event.target.value }))} required /></label>
                  <label className="full">Password<input type="password" value={register.password} onChange={(event) => setRegister((current) => ({ ...current, password: event.target.value }))} required /></label>
                  <label className="full">Phone<input value={register.phone} onChange={(event) => setRegister((current) => ({ ...current, phone: event.target.value }))} /></label>
                  <button className="button primary" type="button" disabled={isSubmitting} onClick={handleRegister}>{isSubmitting ? 'Creating...' : 'Create buyer account'}</button>
                </>
              )}
            </>
          )}

          {auth && (
            <form className="bid-submit-form full" onSubmit={handleBid}>
              <div className="bid-summary">
                <span>Current high bid</span>
                <strong>{currentHighBid ? priceFormatter.format(currentHighBid) : 'No bids yet'}</strong>
              </div>
              <div className="bid-helper-grid">
                <div>
                  <span>Your last bid</span>
                  <strong>{buyerLastBid ? priceFormatter.format(buyerLastBid) : 'None yet'}</strong>
                </div>
                <div>
                  <span>{currentHighBid > 0 ? 'Minimum next bid' : 'Opening bid'}</span>
                  <strong>{priceFormatter.format(minimumNextBid)}</strong>
                </div>
              </div>
              <label>
                Bid amount
                <input
                  type="number"
                  min={minimumNextBid}
                  step={minimumBidIncrement}
                  value={bidAmount}
                  onChange={(event) => setBidAmount(event.target.value)}
                  required
                />
              </label>
              <button className="button secondary dark" type="button" onClick={() => setBidAmount(String(suggestedBid))}>
                Use suggested bid {priceFormatter.format(suggestedBid)}
              </button>
              <button className="button primary" type="submit" disabled={isSubmitting || !selectedItemId}>
                {isSubmitting ? 'Submitting...' : 'Submit bid'}
              </button>
              <button className="button secondary dark" type="button" onClick={signOut}>Sign out</button>
            </form>
          )}
        </section>
      </div>

      <section className="admin-panel admin-table-panel">
        <div className="admin-section-head">
          <span>{itemBids.length} bids</span>
          <h2>Bid activity for this car</h2>
        </div>
        <div className="admin-list">
          {itemBids.map((bid) => (
            <article key={bid.id} className="bid-row">
              <strong>{bid.bidder_name}</strong>
              <span>{priceFormatter.format(Number(bid.amount))} | {bid.status}</span>
            </article>
          ))}
          {auth && itemBids.length === 0 && <p className="admin-empty">No bids have been submitted for this car yet.</p>}
          {!auth && <p className="admin-empty">Sign in to see live bid activity.</p>}
        </div>
      </section>
    </section>
  )
}

export default BidPage
