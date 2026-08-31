import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuctionItems } from '../../api/auctionItems.js'
import { Alert } from '../../components/Feedback.jsx'
import LazyImage from '../../components/LazyImage.jsx'
import {
  buyerLogin,
  buyerRegister,
  fetchBuyerBids,
  fetchBuyerPayments,
  fetchBuyerWonItems,
  fetchCryptoWallets,
  resolveBuyerAssetUrl,
  submitPaymentReceipt,
} from '../../api/buyer.js'
import { featuredVehicles } from '../../data/siteData.js'

const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const defaultLogin = {
  email: '',
  password: '',
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

function getBuyerFriendlyError(error) {
  if (error.message === 'Admin access required.') {
    return 'Please sign in with your buyer account to view dashboard activity.'
  }

  return error.message
}

function DashboardPage() {
  const [auth, setAuth] = useState(() => readBuyerAuth())
  const [mode, setMode] = useState('login')
  const [login, setLogin] = useState(defaultLogin)
  const [register, setRegister] = useState(defaultRegister)
  const [items, setItems] = useState(featuredVehicles)
  const [wallets, setWallets] = useState([])
  const [payments, setPayments] = useState([])
  const [bids, setBids] = useState([])
  const [wonItems, setWonItems] = useState([])
  const [receiptFile, setReceiptFile] = useState(null)
  const [payment, setPayment] = useState({
    cryptoWalletId: '',
    paymentId: '',
    transactionHash: '',
    notes: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bidVehicleCards = useMemo(() => {
    const vehiclesByBid = new Map()

    bids.forEach((bid) => {
      const auctionItemId = bid.auction_item_id
      const existing = vehiclesByBid.get(auctionItemId)
      const item = items.find((vehicle) => String(vehicle.id) === String(auctionItemId))
      const bidAmount = Number(bid.amount || 0)

      vehiclesByBid.set(auctionItemId, {
        id: auctionItemId,
        image: item?.image || resolveBuyerAssetUrl(bid.image_url),
        title: item
          ? `${item.year} ${item.make} ${item.model}`
          : `${bid.year || ''} ${bid.make || ''} ${bid.model || bid.item_title || 'Auction vehicle'}`.trim(),
        lane: item?.lane || bid.lane,
        lot: item?.lot || bid.lot,
        miles: item?.miles || bid.miles,
        status: bid.status,
        itemStatus: item?.status || bid.item_status,
        highestBid: Math.max(existing?.highestBid || 0, bidAmount),
      })
    })

    return Array.from(vehiclesByBid.values())
  }, [bids, items])

  const payableWonItems = useMemo(() => wonItems.filter((item) => item.feePaymentId && item.feeStatus !== 'confirmed'), [wonItems])
  const selectedFeeItem = useMemo(() => (
    payableWonItems.find((item) => String(item.feePaymentId) === String(payment.paymentId)) || payableWonItems[0] || null
  ), [payableWonItems, payment.paymentId])

  useEffect(() => {
    fetchAuctionItems()
      .then((nextItems) => {
        setItems(nextItems)
      })
      .catch(() => {})

    fetchCryptoWallets()
      .then((nextWallets) => {
        setWallets(nextWallets)
        if (nextWallets[0]) {
          setPayment((current) => ({
            ...current,
            cryptoWalletId: nextWallets[0].id,
          }))
        }
      })
      .catch(() => {
        setWallets([])
      })
  }, [])

  useEffect(() => {
    if (!auth) {
      return
    }

    Promise.all([
      fetchBuyerBids(auth.token),
      fetchBuyerPayments(auth.token),
      fetchBuyerWonItems(auth.token),
    ])
      .then(([nextBids, nextPayments, nextWonItems]) => {
        setBids(nextBids)
        setPayments(nextPayments)
        setWonItems(nextWonItems)
        const nextFeeItem = nextWonItems.find((item) => item.feePaymentId && item.feeStatus !== 'confirmed')
        if (nextFeeItem) {
          setPayment((current) => ({ ...current, paymentId: nextFeeItem.feePaymentId }))
        }
      })
      .catch((nextError) => setError(getBuyerFriendlyError(nextError)))
  }, [auth])

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      const nextAuth = await buyerLogin(login.email, login.password)
      saveBuyerAuth(nextAuth)
      setAuth(nextAuth)
      setMessage(`Welcome back, ${nextAuth.user.name}.`)
    } catch (nextError) {
      setError(getBuyerFriendlyError(nextError))
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
      setError(getBuyerFriendlyError(nextError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePayment = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      if (!selectedFeeItem) {
        setError('No auction fee payment is due right now.')
        return
      }

      if (!receiptFile) {
        setError('Upload the payment receipt before submitting.')
        return
      }

      const formData = new FormData()
      formData.append('cryptoWalletId', payment.cryptoWalletId)
      formData.append('transactionHash', payment.transactionHash)
      formData.append('notes', payment.notes)
      formData.append('receipt', receiptFile)

      await submitPaymentReceipt(auth.token, selectedFeeItem.feePaymentId, formData)
      const [nextPayments, nextWonItems] = await Promise.all([
        fetchBuyerPayments(auth.token),
        fetchBuyerWonItems(auth.token),
      ])
      setPayments(nextPayments)
      setWonItems(nextWonItems)
      const nextFeeItem = nextWonItems.find((item) => item.feePaymentId && item.feeStatus !== 'confirmed')
      setPayment((current) => ({
        ...current,
        paymentId: nextFeeItem?.feePaymentId || '',
        notes: '',
        transactionHash: '',
      }))
      setReceiptFile(null)
      event.target.reset()
      setMessage('Auction fee receipt submitted for review.')
    } catch (nextError) {
      setError(getBuyerFriendlyError(nextError))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!auth) {
    return (
      <section className="page-shell dashboard-shell">
        <div className="page-intro compact">
          <p className="eyebrow">Buyer dashboard</p>
          <h1>Sign in to bid, pay, and track your auction items.</h1>
          <p>Use your buyer account to place bids, submit payment details, and follow your vehicle records.</p>
        </div>

        <div className="dashboard-auth-panel">
          <div className="dashboard-tabs">
            <button className={mode === 'login' ? 'active' : undefined} type="button" onClick={() => setMode('login')}>Sign in</button>
            <button className={mode === 'register' ? 'active' : undefined} type="button" onClick={() => setMode('register')}>Register</button>
          </div>

          <Alert type="success">{message}</Alert>
          <Alert type="error">{error}</Alert>

          {mode === 'login' ? (
            <form className="admin-panel admin-form narrow" onSubmit={handleLogin}>
              <label>Email<input type="email" value={login.email} onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))} required /></label>
              <label>Password<input type="password" value={login.password} onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))} required /></label>
              <button className="button primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}</button>
            </form>
          ) : (
            <form className="admin-panel admin-form narrow" onSubmit={handleRegister}>
              <label>Name<input value={register.name} onChange={(event) => setRegister((current) => ({ ...current, name: event.target.value }))} required /></label>
              <label>Email<input type="email" value={register.email} onChange={(event) => setRegister((current) => ({ ...current, email: event.target.value }))} required /></label>
              <label>Password<input type="password" value={register.password} onChange={(event) => setRegister((current) => ({ ...current, password: event.target.value }))} required /></label>
              <label>Phone<input value={register.phone} onChange={(event) => setRegister((current) => ({ ...current, phone: event.target.value }))} /></label>
              <button className="button primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create buyer account'}</button>
            </form>
          )}
        </div>
      </section>
    )
  }

  return (
    <section className="page-shell dashboard-shell">
      <div className="admin-dashboard-head">
        <div className="page-intro compact">
          <p className="eyebrow">Buyer dashboard</p>
          <h1>Your bids, payments, and auction items.</h1>
          <p>Signed in as {auth.user.name}</p>
        </div>
        <button
          className="button secondary dark"
          type="button"
          onClick={() => {
            localStorage.removeItem('buyerAuth')
            localStorage.removeItem('token')
            setAuth(null)
          }}
        >
          Sign out
        </button>
      </div>

      <Alert type="success">{message}</Alert>
      <Alert type="error">{error}</Alert>

      <div className="dashboard-action-grid">
        <section className="admin-panel dashboard-overview-panel">
          <div className="admin-section-head">
            <span>{bidVehicleCards.length} active</span>
            <h2>Cars you're bidding on</h2>
          </div>
          <div className="dashboard-vehicle-list">
            {bidVehicleCards.map((item) => (
              <article className="buyer-selected-item dashboard-bid-vehicle" key={item.id}>
                <LazyImage src={item.image} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>Lane {item.lane} | Lot {item.lot} | Your bid {priceFormatter.format(item.highestBid)}</span>
                  <span>{item.miles} | {item.itemStatus || item.status}</span>
                  <div className="dashboard-inline-actions">
                    <Link className="table-action" to={`/bid/${item.id}`}>Bid again</Link>
                    <Link className="table-action" to={`/inventory/${item.id}`}>Details</Link>
                  </div>
                </div>
              </article>
            ))}
            {bidVehicleCards.length === 0 && (
              <div className="dashboard-empty-state">
                <strong>No active bid vehicles yet.</strong>
                <span>Open the bid page, choose a car, and place your first bid. Your bidding cars will appear here.</span>
              </div>
            )}
          </div>
          <Link className="button primary" to="/bid">Open bid page</Link>
        </section>

        <form className="admin-panel admin-form" onSubmit={handlePayment}>
          <div className="admin-section-head">
            <span>Step 2</span>
            <h2>Submit payment</h2>
          </div>
          <label className="full">
            Won car
            <select
              value={selectedFeeItem?.feePaymentId || payment.paymentId}
              onChange={(event) => setPayment((current) => ({ ...current, paymentId: event.target.value }))}
              required
            >
              {payableWonItems.map((item) => (
                <option key={item.id} value={item.feePaymentId}>
                  {item.title} - fee {priceFormatter.format(Number(item.feeAmount || 0))}
                </option>
              ))}
            </select>
          </label>
          <label>
            Fee amount
            <input value={selectedFeeItem ? priceFormatter.format(Number(selectedFeeItem.feeAmount || 0)) : ''} readOnly />
          </label>
          <label>
            Wallet
            <select
              value={payment.cryptoWalletId}
              onChange={(event) => {
                setPayment((current) => ({
                  ...current,
                  cryptoWalletId: event.target.value,
                }))
              }}
              required
            >
              {wallets.map((item) => (
                <option key={item.id} value={item.id}>{item.currencySymbol} - {item.network}</option>
              ))}
            </select>
          </label>
          <label className="full">Transaction hash<input value={payment.transactionHash} onChange={(event) => setPayment((current) => ({ ...current, transactionHash: event.target.value }))} /></label>
          <label className="full">Payment receipt<input type="file" accept="image/*,.pdf,application/pdf" onChange={(event) => setReceiptFile(event.target.files[0] || null)} required /></label>
          {receiptFile && (
            <p className="admin-file-summary full">Receipt selected: {receiptFile.name}</p>
          )}
          <label className="full">Notes<textarea value={payment.notes} onChange={(event) => setPayment((current) => ({ ...current, notes: event.target.value }))} /></label>
          {wallets.find((item) => String(item.id) === String(payment.cryptoWalletId)) && (
            <article className="buyer-wallet-card full">
              {(() => {
                const wallet = wallets.find((item) => String(item.id) === String(payment.cryptoWalletId))
                return (
                  <>
                    {wallet.qrCodeUrl && <img src={resolveBuyerAssetUrl(wallet.qrCodeUrl)} alt={`${wallet.walletName} QR code`} />}
                    <div>
                      <strong>{wallet.walletName}</strong>
                      <span>{wallet.walletAddress}</span>
                    </div>
                  </>
                )
              })()}
            </article>
          )}
          {!selectedFeeItem && (
            <p className="admin-empty full">No auction fee is due right now.</p>
          )}
          <button className="button primary" type="submit" disabled={isSubmitting || !selectedFeeItem}>Submit fee receipt</button>
        </form>
      </div>

      <div className="dashboard-history-grid">
        <section className="admin-panel admin-table-panel">
          <div className="admin-section-head">
            <span>{bids.length} records</span>
            <h2>Your bid items</h2>
          </div>
          <div className="admin-list">
            {bids.map((bid) => (
              <article key={bid.id}>
                <strong>{bid.item_title}</strong>
                <span>Lane {bid.lane} | Lot {bid.lot} | {priceFormatter.format(Number(bid.amount))} | {bid.status}</span>
              </article>
            ))}
            {bids.length === 0 && <p className="admin-empty">No bids yet.</p>}
          </div>
        </section>

        <section className="admin-panel admin-table-panel">
          <div className="admin-section-head">
            <span>{wonItems.length} records</span>
            <h2>Your items</h2>
          </div>
          <div className="admin-list">
            {wonItems.map((item) => (
              <article key={item.id} className="buyer-selected-item dashboard-bid-vehicle">
                <LazyImage src={resolveBuyerAssetUrl(item.imageUrl)} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <span>Fee {priceFormatter.format(Number(item.feeAmount || 0))} | Fee status {item.feeStatus}</span>
                  <span>Item status {item.itemStatus.replaceAll('_', ' ')}</span>
                </div>
              </article>
            ))}
            {wonItems.length === 0 && <p className="admin-empty">Won cars will appear here after an auction closes.</p>}
          </div>
        </section>

        <section className="admin-panel admin-table-panel">
          <div className="admin-section-head">
            <span>{payments.length} records</span>
            <h2>Your payments</h2>
          </div>
          <div className="admin-list">
            {payments.map((item) => (
              <article key={item.id}>
                <strong>{item.itemTitle || 'Auction payment'}</strong>
                <span>{priceFormatter.format(Number(item.amount))} | {item.currencySymbol} | {item.status}</span>
                {item.receiptUrl && <a className="table-action" href={resolveBuyerAssetUrl(item.receiptUrl)} target="_blank">View receipt</a>}
              </article>
            ))}
            {payments.length === 0 && <p className="admin-empty">No payments submitted yet.</p>}
          </div>
        </section>
      </div>
    </section>
  )
}

export default DashboardPage
