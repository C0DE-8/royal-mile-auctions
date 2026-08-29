import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAuctionItems } from '../../api/auctionItems.js'
import {
  buyerLogin,
  buyerRegister,
  createPayment,
  fetchBuyerBids,
  fetchBuyerPayments,
  fetchCryptoWallets,
  resolveBuyerAssetUrl,
} from '../../api/buyer.js'
import { featuredVehicles } from '../../data/siteData.js'

const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})

const defaultLogin = {
  email: 'buyer@example.com',
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

function DashboardPage() {
  const [auth, setAuth] = useState(() => readBuyerAuth())
  const [mode, setMode] = useState('login')
  const [login, setLogin] = useState(defaultLogin)
  const [register, setRegister] = useState(defaultRegister)
  const [items, setItems] = useState(featuredVehicles)
  const [selectedItemId, setSelectedItemId] = useState('')
  const [wallets, setWallets] = useState([])
  const [payments, setPayments] = useState([])
  const [bids, setBids] = useState([])
  const [payment, setPayment] = useState({
    amount: '',
    cryptoWalletId: '',
    currencySymbol: 'BTC',
    transactionHash: '',
    notes: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const recentItems = items.slice(0, 4)

  useEffect(() => {
    fetchAuctionItems()
      .then((nextItems) => {
        setItems(nextItems)
        if (nextItems[0]) {
          setSelectedItemId(nextItems[0].id)
        }
      })
      .catch(() => {
        if (featuredVehicles[0]) {
          setSelectedItemId(featuredVehicles[0].id)
        }
      })

    fetchCryptoWallets()
      .then((nextWallets) => {
        setWallets(nextWallets)
        if (nextWallets[0]) {
          setPayment((current) => ({
            ...current,
            cryptoWalletId: nextWallets[0].id,
            currencySymbol: nextWallets[0].currencySymbol,
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
    ])
      .then(([nextBids, nextPayments]) => {
        setBids(nextBids)
        setPayments(nextPayments)
      })
      .catch((nextError) => setError(nextError.message))
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

  const handlePayment = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    setMessage('')

    try {
      await createPayment(auth.token, {
        ...payment,
        auctionItemId: selectedItemId,
      })
      setPayments(await fetchBuyerPayments(auth.token))
      setPayment((current) => ({
        ...current,
        amount: '',
        notes: '',
        transactionHash: '',
      }))
      setMessage('Payment information submitted for review.')
    } catch (nextError) {
      setError(nextError.message)
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

          {message && <p className="admin-alert success">{message}</p>}
          {error && <p className="admin-alert error">{error}</p>}

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

      {message && <p className="admin-alert success">{message}</p>}
      {error && <p className="admin-alert error">{error}</p>}

      <div className="dashboard-action-grid">
        <section className="admin-panel dashboard-overview-panel">
          <div className="admin-section-head">
            <span>{recentItems.length} available</span>
            <h2>Ready to bid</h2>
          </div>
          <div className="dashboard-vehicle-list">
            {recentItems.map((item) => (
              <article className="buyer-selected-item" key={item.id}>
                <img src={item.image} alt={`${item.year} ${item.make} ${item.model}`} />
                <div>
                  <strong>{item.year} {item.make} {item.model}</strong>
                  <span>Lane {item.lane} | Lot {item.lot} | {priceFormatter.format(item.mainPrice)}</span>
                  <div className="dashboard-inline-actions">
                    <Link className="table-action" to={`/bid/${item.id}`}>Bid</Link>
                    <Link className="table-action" to={`/inventory/${item.id}`}>Details</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <Link className="button primary" to="/bid">Open bid page</Link>
        </section>

        <form className="admin-panel admin-form" onSubmit={handlePayment}>
          <div className="admin-section-head">
            <span>Step 2</span>
            <h2>Submit payment</h2>
          </div>
          <label>Amount<input value={payment.amount} onChange={(event) => setPayment((current) => ({ ...current, amount: event.target.value }))} required /></label>
          <label>
            Wallet
            <select
              value={payment.cryptoWalletId}
              onChange={(event) => {
                const nextWallet = wallets.find((item) => String(item.id) === event.target.value)
                setPayment((current) => ({
                  ...current,
                  cryptoWalletId: event.target.value,
                  currencySymbol: nextWallet?.currencySymbol || current.currencySymbol,
                }))
              }}
            >
              {wallets.map((item) => (
                <option key={item.id} value={item.id}>{item.currencySymbol} - {item.network}</option>
              ))}
            </select>
          </label>
          <label className="full">Transaction hash<input value={payment.transactionHash} onChange={(event) => setPayment((current) => ({ ...current, transactionHash: event.target.value }))} /></label>
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
          <button className="button primary" type="submit" disabled={isSubmitting}>Submit payment info</button>
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
            <span>{payments.length} records</span>
            <h2>Your payments</h2>
          </div>
          <div className="admin-list">
            {payments.map((item) => (
              <article key={item.id}>
                <strong>{item.item_title || 'Auction payment'}</strong>
                <span>{priceFormatter.format(Number(item.amount))} | {item.currency_symbol} | {item.status}</span>
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
