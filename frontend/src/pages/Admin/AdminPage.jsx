import { useEffect, useMemo, useState } from 'react'
import {
  adminLogin,
  closeAuctionItem,
  createDemoBid,
  createAuctionItem,
  createCryptoWallet,
  deleteAuctionItem,
  deleteCryptoWallet,
  fetchAdminAuctionItems,
  fetchAdminBids,
  fetchAdminCryptoWallets,
  fetchAdminEmailLogs,
  fetchAdminMetrics,
  fetchAdminPayments,
  fetchAdminUsers,
  resolveAdminAssetUrl,
  sendAdminEmail,
  updateAdminPayment,
  updateAdminUser,
  updateAuctionItem,
  updateCryptoWallet,
} from '../../api/admin.js'
import { Alert, Toast } from '../../components/Feedback.jsx'
import LazyImage from '../../components/LazyImage.jsx'

const adminTabs = ['Inventory', 'Bids', 'Payments', 'Wallets', 'Users', 'Mailer']
const pageSize = 5

const defaultVehicle = {
  year: '',
  make: '',
  model: '',
  category: 'Cars',
  miles: '',
  lane: '',
  lot: '',
  mainPrice: '',
  discountPercent: '60',
  vin: '',
  titleStatus: '',
  status: 'Green light',
  seller: '',
  light: 'Green light',
  transmission: 'Automatic',
  drivetrain: '',
  notes: '',
}

const defaultWallet = {
  walletName: '',
  network: '',
  currencySymbol: '',
  walletAddress: '',
  instructions: '',
}

const defaultDemoBid = {
  auctionItemId: '',
  bidderName: '',
  bidderEmail: '',
  amount: '',
  status: 'pending',
}

const defaultMailer = {
  body: '',
  emails: '',
  recipientMode: 'manual',
  subject: '',
}

const defaultMetrics = {
  activeBids: 0,
  activeBuyers: 0,
  activeItems: 0,
  activeWallets: 0,
  admins: 0,
  closedAuctions: 0,
  failedEmails: 0,
  pendingPayments: 0,
  sentEmails: 0,
  totalUsers: 0,
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
})
const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function vehicleToForm(item) {
  return {
    year: String(item.year || ''),
    make: item.make || '',
    model: item.model || '',
    category: item.category || 'Cars',
    miles: item.miles || '',
    lane: item.lane || '',
    lot: item.lot || '',
    mainPrice: String(item.mainPrice || ''),
    discountPercent: String(item.discountPercent || 60),
    vin: item.vin || '',
    titleStatus: item.titleStatus || '',
    status: item.status || 'Green light',
    seller: item.seller || '',
    light: item.light || 'Green light',
    transmission: item.transmission || 'Automatic',
    drivetrain: item.drivetrain || '',
    notes: item.notes || '',
  }
}

function walletToForm(item) {
  return {
    walletName: item.walletName || '',
    network: item.network || '',
    currencySymbol: item.currencySymbol || '',
    walletAddress: item.walletAddress || '',
    instructions: item.instructions || '',
  }
}

function includesSearch(values, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase()

  if (!normalizedSearch) {
    return true
  }

  return values
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch))
}

function paginate(items, page) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const start = (currentPage - 1) * pageSize

  return {
    currentPage,
    pageCount,
    rows: items.slice(start, start + pageSize),
  }
}

function parseManualEmails(value) {
  return value
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function PaginationControls({ currentPage, pageCount, totalCount, onPageChange }) {
  return (
    <div className="admin-pagination">
      <span>
        Page {currentPage} of {pageCount} · {totalCount} result{totalCount === 1 ? '' : 's'}
      </span>
      <div>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function SkeletonList({ type = 'media' }) {
  return (
    <div className="admin-skeleton-list" aria-label="Loading records">
      {Array.from({ length: 4 }).map((_, index) => (
        <div className={`admin-skeleton ${type}`} key={index}>
          {type === 'media' && <span className="admin-skeleton-thumb" />}
          <div>
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message }) {
  return <p className="admin-empty">{message}</p>
}

function AdminPage() {
  const [auth, setAuth] = useState(null)
  const [activeTab, setActiveTab] = useState('Inventory')
  const [login, setLogin] = useState({
    email: 'admin@royalmileauctions.com',
    password: 'AdminPass123!',
  })
  const [vehicle, setVehicle] = useState(defaultVehicle)
  const [wallet, setWallet] = useState(defaultWallet)
  const [demoBid, setDemoBid] = useState(defaultDemoBid)
  const [mailer, setMailer] = useState(defaultMailer)
  const [vehicleImage, setVehicleImage] = useState(null)
  const [vehicleImages, setVehicleImages] = useState([])
  const [walletQr, setWalletQr] = useState(null)
  const [editingVehicleId, setEditingVehicleId] = useState(null)
  const [editingWalletId, setEditingWalletId] = useState(null)
  const [auctionItems, setAuctionItems] = useState([])
  const [bids, setBids] = useState([])
  const [wallets, setWallets] = useState([])
  const [users, setUsers] = useState([])
  const [payments, setPayments] = useState([])
  const [emailLogs, setEmailLogs] = useState([])
  const [metrics, setMetrics] = useState(defaultMetrics)
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [inventorySearch, setInventorySearch] = useState('')
  const [walletSearch, setWalletSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [bidVehicleFilter, setBidVehicleFilter] = useState('')
  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [inventoryPage, setInventoryPage] = useState(1)
  const [walletPage, setWalletPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [paymentPage, setPaymentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState(null)
  const [toast, setToast] = useState(null)

  const summary = useMemo(() => ({
    ...defaultMetrics,
    activeItems: metrics.activeItems || auctionItems.filter((item) => item.isActive).length,
    activeWallets: metrics.activeWallets || wallets.filter((item) => item.isActive).length,
    admins: metrics.admins || users.filter((user) => user.role === 'admin').length,
    activeBids: metrics.activeBids,
    activeBuyers: metrics.activeBuyers || users.filter((user) => user.role === 'user' && user.isActive).length,
    closedAuctions: metrics.closedAuctions,
    failedEmails: metrics.failedEmails,
    pendingPayments: metrics.pendingPayments,
    sentEmails: metrics.sentEmails,
    totalUsers: metrics.totalUsers || users.length,
  }), [auctionItems, metrics, users, wallets])

  const filteredInventory = useMemo(() => auctionItems.filter((item) => includesSearch([
    item.title,
    item.make,
    item.model,
    item.category,
    item.lane,
    item.lot,
    item.vin,
    item.seller,
  ], inventorySearch)), [auctionItems, inventorySearch])

  const filteredWallets = useMemo(() => wallets.filter((item) => includesSearch([
    item.walletName,
    item.network,
    item.currencySymbol,
    item.walletAddress,
  ], walletSearch)), [walletSearch, wallets])

  const filteredUsers = useMemo(() => users.filter((user) => includesSearch([
    user.name,
    user.email,
    user.role,
    user.isActive ? 'active' : 'inactive',
  ], userSearch)), [userSearch, users])

  const filteredBids = useMemo(() => (
    bidVehicleFilter
      ? bids.filter((bid) => String(bid.auction_item_id) === String(bidVehicleFilter))
      : bids
  ), [bidVehicleFilter, bids])

  const filteredPayments = useMemo(() => payments.filter((payment) => {
    const matchesStatus = paymentStatusFilter ? payment.status === paymentStatusFilter : true
    const matchesSearch = includesSearch([
      payment.buyer_name,
      payment.buyer_email,
      payment.item_title,
      payment.currency_symbol,
      payment.transaction_hash,
      payment.status,
    ], paymentSearch)

    return matchesStatus && matchesSearch
  }), [paymentSearch, paymentStatusFilter, payments])

  const selectedUsers = useMemo(() => users.filter((user) => selectedUserIds.includes(user.id)), [selectedUserIds, users])
  const manualEmails = useMemo(() => parseManualEmails(mailer.emails), [mailer.emails])
  const mailerRecipientCount = mailer.recipientMode === 'all-active'
    ? summary.activeBuyers
    : mailer.recipientMode === 'selected'
      ? selectedUsers.length
      : manualEmails.length

  const inventoryList = useMemo(
    () => paginate(filteredInventory, inventoryPage),
    [filteredInventory, inventoryPage],
  )
  const walletList = useMemo(
    () => paginate(filteredWallets, walletPage),
    [filteredWallets, walletPage],
  )
  const userList = useMemo(
    () => paginate(filteredUsers, userPage),
    [filteredUsers, userPage],
  )
  const paymentList = useMemo(
    () => paginate(filteredPayments, paymentPage),
    [filteredPayments, paymentPage],
  )

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!auth) {
      return undefined
    }

    let isMounted = true

    Promise.all([
      fetchAdminAuctionItems(auth.token),
      fetchAdminBids(auth.token),
      fetchAdminCryptoWallets(auth.token),
      fetchAdminUsers(auth.token),
      fetchAdminPayments(auth.token),
      fetchAdminEmailLogs(auth.token),
      fetchAdminMetrics(auth.token),
    ])
      .then(([items, nextBids, nextWallets, nextUsers, nextPayments, nextEmailLogs, nextMetrics]) => {
        if (isMounted) {
          setAuctionItems(items)
          setBids(nextBids)
          setWallets(nextWallets)
          setUsers(nextUsers)
          setPayments(nextPayments)
          setEmailLogs(nextEmailLogs)
          setMetrics(nextMetrics)
          setAlert({ type: 'success', message: 'Admin data loaded from the backend.' })
        }
      })
      .catch((error) => {
        if (isMounted) {
          setAlert({ type: 'error', message: error.message })
          setToast({ type: 'error', message: error.message })
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [auth])

  const showSuccess = (message) => {
    setAlert({ type: 'success', message })
    setToast({ type: 'success', message })
  }

  const showError = (message) => {
    setAlert({ type: 'error', message })
    setToast({ type: 'error', message })
  }

  const refreshAdminData = async (token) => {
    const [items, nextBids, nextWallets, nextUsers, nextPayments, nextEmailLogs, nextMetrics] = await Promise.all([
      fetchAdminAuctionItems(token),
      fetchAdminBids(token),
      fetchAdminCryptoWallets(token),
      fetchAdminUsers(token),
      fetchAdminPayments(token),
      fetchAdminEmailLogs(token),
      fetchAdminMetrics(token),
    ])
    setAuctionItems(items)
    setBids(nextBids)
    setWallets(nextWallets)
    setUsers(nextUsers)
    setPayments(nextPayments)
    setEmailLogs(nextEmailLogs)
    setMetrics(nextMetrics)
  }

  const updateVehicle = (event) => {
    setVehicle((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const updateWallet = (event) => {
    setWallet((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const updateDemoBid = (event) => {
    setDemoBid((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const updateMailer = (event) => {
    setMailer((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    try {
      const nextAuth = await adminLogin(login.email, login.password)
      setIsLoading(true)
      setAuth(nextAuth)
      showSuccess(`Signed in as ${nextAuth.user.name}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVehicleSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    try {
      const formData = new FormData()
      Object.entries(vehicle).forEach(([key, value]) => formData.append(key, value))
      if (vehicleImage) {
        formData.append('image', vehicleImage)
      }
      vehicleImages.forEach((image) => formData.append('images', image))

      const item = editingVehicleId
        ? await updateAuctionItem(auth.token, editingVehicleId, formData)
        : await createAuctionItem(auth.token, formData)
      await refreshAdminData(auth.token)
      setVehicle(defaultVehicle)
      setVehicleImage(null)
      setVehicleImages([])
      setEditingVehicleId(null)
      event.target.reset()
      showSuccess(`Auction item ${editingVehicleId ? 'updated' : 'created'}: ${item.title}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWalletSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    try {
      const formData = new FormData()
      Object.entries(wallet).forEach(([key, value]) => formData.append(key, value))
      if (walletQr) {
        formData.append('qrCode', walletQr)
      }

      const item = editingWalletId
        ? await updateCryptoWallet(auth.token, editingWalletId, formData)
        : await createCryptoWallet(auth.token, formData)
      await refreshAdminData(auth.token)
      setWallet(defaultWallet)
      setWalletQr(null)
      setEditingWalletId(null)
      event.target.reset()
      showSuccess(`Wallet ${editingWalletId ? 'updated' : 'created'}: ${item.walletName}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDemoBidSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    try {
      const item = await createDemoBid(auth.token, {
        ...demoBid,
        auctionItemId: demoBid.auctionItemId || auctionItems[0]?.id,
      })
      setBids(await fetchAdminBids(auth.token))
      setDemoBid((current) => ({
        ...defaultDemoBid,
        auctionItemId: current.auctionItemId,
      }))
      event.target.reset()
      showSuccess(`Demo bid added for ${item.item_title}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleUserSelection = (userId) => {
    setSelectedUserIds((current) => (
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId]
    ))
  }

  const selectFilteredUsers = () => {
    setSelectedUserIds(filteredUsers.map((user) => user.id))
  }

  const clearSelectedUsers = () => {
    setSelectedUserIds([])
  }

  const emailUser = (user) => {
    setSelectedUserIds([user.id])
    setMailer((current) => ({ ...current, recipientMode: 'selected' }))
    setActiveTab('Mailer')
    setAlert({ type: 'info', message: `Preparing an email to ${user.email}.` })
  }

  const emailBidder = (bid) => {
    setMailer((current) => ({
      ...current,
      emails: bid.bidder_email || '',
      recipientMode: 'manual',
      subject: current.subject || `Update for ${bid.item_title}`,
    }))
    setActiveTab('Mailer')
    setAlert({ type: 'info', message: `Preparing an email to ${bid.bidder_email}.` })
  }

  const emailPaymentBuyer = (payment) => {
    setMailer((current) => ({
      ...current,
      emails: payment.buyer_email || '',
      recipientMode: 'manual',
      subject: current.subject || `Payment update for ${payment.item_title || 'your auction purchase'}`,
    }))
    setActiveTab('Mailer')
    setAlert({ type: 'info', message: `Preparing an email to ${payment.buyer_email}.` })
  }

  const handleUserStatusToggle = async (user) => {
    setIsSubmitting(true)
    setAlert(null)

    try {
      const updated = await updateAdminUser(auth.token, user.id, { isActive: !user.isActive })
      await refreshAdminData(auth.token)
      setSelectedUserIds((current) => current.filter((id) => id !== user.id || updated.isActive))
      showSuccess(`${updated.email} is now ${updated.isActive ? 'active' : 'inactive'}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUserRoleToggle = async (user) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    if (!window.confirm(`Change ${user.email} to ${nextRole}?`)) {
      return
    }

    setIsSubmitting(true)
    setAlert(null)

    try {
      const updated = await updateAdminUser(auth.token, user.id, { role: nextRole })
      await refreshAdminData(auth.token)
      showSuccess(`${updated.email} is now ${updated.role}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePaymentStatusChange = async (payment, status) => {
    setIsSubmitting(true)
    setAlert(null)

    try {
      const updated = await updateAdminPayment(auth.token, payment.id, { status })
      await refreshAdminData(auth.token)
      showSuccess(`Payment from ${updated.buyer_name} marked ${updated.status}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEmailSelected = () => {
    if (selectedUserIds.length === 0) {
      showError('Select at least one user before opening the mailer.')
      return
    }

    setMailer((current) => ({ ...current, recipientMode: 'selected' }))
    setActiveTab('Mailer')
    setAlert({ type: 'info', message: `${selectedUserIds.length} user${selectedUserIds.length === 1 ? '' : 's'} selected for email.` })
  }

  const handleMailerSubmit = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setAlert(null)

    try {
      if (mailer.recipientMode === 'selected' && selectedUserIds.length === 0) {
        showError('Select at least one user recipient.')
        return
      }

      if (mailer.recipientMode === 'manual' && manualEmails.length === 0) {
        showError('Enter at least one valid recipient email.')
        return
      }

      if (mailer.recipientMode === 'all-active' && summary.activeBuyers === 0) {
        showError('There are no active buyer accounts to email.')
        return
      }

      if (mailerRecipientCount > 1 && !window.confirm(`Send this email to ${mailerRecipientCount} recipients?`)) {
        return
      }

      const result = await sendAdminEmail(auth.token, {
        body: mailer.body,
        emails: mailer.recipientMode === 'manual' ? manualEmails : [],
        recipientMode: mailer.recipientMode,
        subject: mailer.subject,
        userIds: mailer.recipientMode === 'selected' ? selectedUserIds : [],
      })

      setEmailLogs(await fetchAdminEmailLogs(auth.token))
      setMetrics(await fetchAdminMetrics(auth.token))

      if (result.sentCount > 0 && result.failedCount === 0) {
        setMailer(defaultMailer)
        showSuccess(`Email sent to ${result.sentCount} recipient${result.sentCount === 1 ? '' : 's'}.`)
        return
      }

      if (result.sentCount > 0) {
        showError(`Email sent to ${result.sentCount}, but ${result.failedCount} failed.`)
        return
      }

      showError(result.failedRecipients?.[0]?.error || 'Email could not be sent.')
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCloseAuction = async () => {
    if (!bidVehicleFilter) {
      showError('Choose one vehicle before closing an auction.')
      return
    }

    const item = auctionItems.find((auctionItem) => String(auctionItem.id) === String(bidVehicleFilter))
    if (!item || !window.confirm(`Close auction for ${item.title}? Highest bid will win.`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const result = await closeAuctionItem(auth.token, bidVehicleFilter)
      await refreshAdminData(auth.token)
      setMailer((current) => ({
        ...current,
        body: current.body || `Hello ${result.winningBid.bidder_name},\n\nYour winning bid for ${result.item.title} was ${priceFormatter.format(Number(result.winningBid.amount))}. Please sign in to your buyer dashboard to review payment and release steps.\n\nRoyal Mile Auctions`,
        emails: result.winningBid.bidder_email || '',
        recipientMode: 'manual',
        subject: current.subject || `Winning bid confirmation for ${result.item.title}`,
      }))
      setActiveTab('Mailer')
      showSuccess(`${result.winningBid.bidder_name} won ${result.item.title}. A winner email is ready to review.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startVehicleEdit = (item) => {
    setVehicle(vehicleToForm(item))
    setVehicleImage(null)
    setVehicleImages([])
    setEditingVehicleId(item.id)
    setAlert({ type: 'success', message: `Editing ${item.title}.` })
    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  const cancelVehicleEdit = () => {
    setVehicle(defaultVehicle)
    setVehicleImage(null)
    setVehicleImages([])
    setEditingVehicleId(null)
    setAlert(null)
  }

  const handleVehicleDelete = async (item) => {
    if (!window.confirm(`Delete ${item.title}?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      await deleteAuctionItem(auth.token, item.id)
      await refreshAdminData(auth.token)
      if (editingVehicleId === item.id) {
        cancelVehicleEdit()
      }
      showSuccess(`Auction item deleted: ${item.title}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const startWalletEdit = (item) => {
    setWallet(walletToForm(item))
    setWalletQr(null)
    setEditingWalletId(item.id)
    setAlert({ type: 'success', message: `Editing ${item.walletName}.` })
    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  const cancelWalletEdit = () => {
    setWallet(defaultWallet)
    setWalletQr(null)
    setEditingWalletId(null)
    setAlert(null)
  }

  const handleWalletDelete = async (item) => {
    if (!window.confirm(`Delete ${item.walletName}?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      await deleteCryptoWallet(auth.token, item.id)
      await refreshAdminData(auth.token)
      if (editingWalletId === item.id) {
        cancelWalletEdit()
      }
      showSuccess(`Wallet deleted: ${item.walletName}.`)
    } catch (error) {
      showError(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!auth) {
    return (
      <section className="page-shell admin-shell">
        <Toast toast={toast} onClose={() => setToast(null)} />
        <div className="admin-login-layout">
          <div className="page-intro compact">
            <p className="eyebrow">Admin console</p>
            <h1>Manage auction inventory, users, and payment wallets.</h1>
            <p>Use an admin account to upload vehicles, maintain wallet details, and review buyer accounts.</p>
          </div>
          <form className="admin-panel admin-form narrow" onSubmit={handleLogin}>
            <div className="admin-section-head">
              <span>Secure access</span>
              <h2>Admin sign in</h2>
            </div>
            <label>
              Email
              <input
                name="email"
                type="email"
                value={login.email}
                onChange={(event) => setLogin((current) => ({ ...current, email: event.target.value }))}
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                value={login.password}
                onChange={(event) => setLogin((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="button primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
            <Alert type={alert?.type}>{alert?.message}</Alert>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="page-shell admin-shell">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div className="admin-dashboard-head">
        <div className="page-intro compact">
          <p className="eyebrow">Admin console</p>
          <h1>Operations dashboard</h1>
          <p>Signed in as {auth.user.name}</p>
        </div>
        <button className="button secondary dark" type="button" onClick={() => setAuth(null)}>
          Sign out
        </button>
      </div>

      <div className="admin-summary-grid" aria-label="Admin summary">
        <article>
          <span>Active inventory</span>
          <strong>{summary.activeItems}</strong>
        </article>
        <article>
          <span>Active bids</span>
          <strong>{summary.activeBids}</strong>
        </article>
        <article>
          <span>Pending payments</span>
          <strong>{summary.pendingPayments}</strong>
        </article>
        <article>
          <span>Active buyers</span>
          <strong>{summary.activeBuyers}</strong>
        </article>
        <article>
          <span>Payment wallets</span>
          <strong>{summary.activeWallets}</strong>
        </article>
        <article>
          <span>Admin users</span>
          <strong>{summary.admins}</strong>
        </article>
        <article>
          <span>Sent emails</span>
          <strong>{summary.sentEmails}</strong>
        </article>
      </div>

      <Alert type={alert?.type}>{alert?.message}</Alert>

      <div className="admin-tabs" role="tablist" aria-label="Admin sections">
        {adminTabs.map((tab) => (
          <button
            className={activeTab === tab ? 'active' : undefined}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            key={tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Inventory' && (
        <div className="admin-workspace">
          <form className="admin-panel admin-form" onSubmit={handleVehicleSubmit}>
            <div className="admin-section-head">
              <span>{editingVehicleId ? 'Inventory edit' : 'Inventory upload'}</span>
              <h2>{editingVehicleId ? 'Edit auction item' : 'Auction item'}</h2>
            </div>
            <label>Year<input name="year" value={vehicle.year} onChange={updateVehicle} required /></label>
            <label>Make<input name="make" value={vehicle.make} onChange={updateVehicle} required /></label>
            <label>Model<input name="model" value={vehicle.model} onChange={updateVehicle} required /></label>
            <label>
              Category
              <select name="category" value={vehicle.category} onChange={updateVehicle}>
                <option>Cars</option>
                <option>Trucks</option>
                <option>SUVs</option>
              </select>
            </label>
            <label>Miles<input name="miles" value={vehicle.miles} onChange={updateVehicle} required /></label>
            <label>Lane<input name="lane" value={vehicle.lane} onChange={updateVehicle} required /></label>
            <label>Lot<input name="lot" value={vehicle.lot} onChange={updateVehicle} required /></label>
            <label>Main price<input name="mainPrice" value={vehicle.mainPrice} onChange={updateVehicle} required /></label>
            <label>Discount %<input name="discountPercent" value={vehicle.discountPercent} onChange={updateVehicle} /></label>
            <label>VIN<input name="vin" value={vehicle.vin} onChange={updateVehicle} required /></label>
            <label>Title status<input name="titleStatus" value={vehicle.titleStatus} onChange={updateVehicle} required /></label>
            <label>Status<input name="status" value={vehicle.status} onChange={updateVehicle} required /></label>
            <label>Seller<input name="seller" value={vehicle.seller} onChange={updateVehicle} required /></label>
            <label>Light<input name="light" value={vehicle.light} onChange={updateVehicle} required /></label>
            <label>Transmission<input name="transmission" value={vehicle.transmission} onChange={updateVehicle} required /></label>
            <label>Drivetrain<input name="drivetrain" value={vehicle.drivetrain} onChange={updateVehicle} required /></label>
            <label className="full">Notes<textarea name="notes" value={vehicle.notes} onChange={updateVehicle} required /></label>
            <label className="full">Primary vehicle image<input type="file" accept="image/*" onChange={(event) => setVehicleImage(event.target.files[0])} /></label>
            <label className="full">More vehicle images<input type="file" accept="image/*" multiple onChange={(event) => setVehicleImages(Array.from(event.target.files))} /></label>
            {vehicleImages.length > 0 && (
              <p className="admin-file-summary full">
                {vehicleImages.length} additional image{vehicleImages.length === 1 ? '' : 's'} selected.
              </p>
            )}
            <div className="admin-form-actions">
              <button className="button primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingVehicleId ? 'Save auction item' : 'Create auction item'}
              </button>
              {editingVehicleId && (
                <button className="button secondary dark" type="button" onClick={cancelVehicleEdit}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <aside className="admin-panel admin-list-panel">
            <div className="admin-section-head">
              <span>{isLoading ? 'Loading' : `${filteredInventory.length} of ${auctionItems.length} records`}</span>
              <h2>Recent inventory</h2>
            </div>
            <label className="admin-search">
              Search inventory
              <input
                type="search"
                value={inventorySearch}
                placeholder="Search title, lane, lot, VIN"
                onChange={(event) => {
                  setInventorySearch(event.target.value)
                  setInventoryPage(1)
                }}
              />
            </label>
            <div className="admin-list">
              {isLoading && <SkeletonList />}
              {!isLoading && inventoryList.rows.map((item) => (
                  <article className="admin-media-item" key={item.id}>
                    {item.imageUrl && (
                      <LazyImage src={resolveAdminAssetUrl(item.imageUrl)} alt={item.title} />
                    )}
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        {item.category} | Lane {item.lane} | {priceFormatter.format(item.auctionPrice)} | {(item.images?.length || 1)} photo{(item.images?.length || 1) === 1 ? '' : 's'}
                      </span>
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => startVehicleEdit(item)}>Edit</button>
                        <button type="button" className="danger" onClick={() => handleVehicleDelete(item)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              {!isLoading && inventoryList.rows.length === 0 && (
                <EmptyState message="No inventory records match your search." />
              )}
            </div>
            {!isLoading && filteredInventory.length > 0 && (
              <PaginationControls
                currentPage={inventoryList.currentPage}
                pageCount={inventoryList.pageCount}
                totalCount={filteredInventory.length}
                onPageChange={setInventoryPage}
              />
            )}
          </aside>
        </div>
      )}

      {activeTab === 'Bids' && (
        <div className="admin-workspace">
          <form className="admin-panel admin-form" onSubmit={handleDemoBidSubmit}>
            <div className="admin-section-head">
              <span>Demo bidder</span>
              <h2>Add a bid for a car</h2>
            </div>
            <label className="full">
              Vehicle
              <select
                name="auctionItemId"
                value={demoBid.auctionItemId || auctionItems[0]?.id || ''}
                onChange={updateDemoBid}
                required
              >
                {auctionItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} | Lane {item.lane} | Lot {item.lot}
                  </option>
                ))}
              </select>
            </label>
            <label>Bidder name<input name="bidderName" value={demoBid.bidderName} onChange={updateDemoBid} required /></label>
            <label>Bidder email<input name="bidderEmail" type="email" value={demoBid.bidderEmail} onChange={updateDemoBid} /></label>
            <label>Bid amount<input name="amount" value={demoBid.amount} onChange={updateDemoBid} required /></label>
            <label>
              Status
              <select name="status" value={demoBid.status} onChange={updateDemoBid}>
                <option value="pending">Pending</option>
                <option value="winning">Winning</option>
                <option value="outbid">Outbid</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
            <button className="button primary" type="submit" disabled={isSubmitting || auctionItems.length === 0}>
              {isSubmitting ? 'Adding...' : 'Add demo bid'}
            </button>
          </form>

          <aside className="admin-panel admin-list-panel">
            <div className="admin-section-head">
              <span>{filteredBids.length} of {bids.length} bids</span>
              <h2>Car bid activity</h2>
            </div>
            <label className="admin-search">
              Filter by vehicle
              <select value={bidVehicleFilter} onChange={(event) => setBidVehicleFilter(event.target.value)}>
                <option value="">All vehicles</option>
                {auctionItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} | Lot {item.lot}
                  </option>
                ))}
              </select>
            </label>
            <div className="admin-row-actions">
              <button
                type="button"
                className="danger"
                disabled={!bidVehicleFilter || isSubmitting}
                onClick={handleCloseAuction}
              >
                Close selected auction
              </button>
            </div>
            <div className="admin-list">
              {isLoading && <SkeletonList type="text" />}
              {!isLoading && filteredBids.map((bid) => (
                <article className="admin-bid-item" key={bid.id}>
                  <strong>{bid.item_title}</strong>
                  <span>{bid.bidder_name} | {bid.bidder_email}</span>
                  <span>Lane {bid.lane} | Lot {bid.lot} | {priceFormatter.format(Number(bid.amount))} | {bid.status}</span>
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => emailBidder(bid)}>
                      Email bidder
                    </button>
                  </div>
                </article>
              ))}
              {!isLoading && filteredBids.length === 0 && (
                <EmptyState message="No bids match this vehicle filter." />
              )}
            </div>
          </aside>
        </div>
      )}

      {activeTab === 'Wallets' && (
        <div className="admin-workspace compact">
          <form className="admin-panel admin-form" onSubmit={handleWalletSubmit}>
            <div className="admin-section-head">
              <span>{editingWalletId ? 'Wallet edit' : 'Payment setup'}</span>
              <h2>{editingWalletId ? 'Edit crypto wallet' : 'Crypto wallet'}</h2>
            </div>
            <label>Wallet name<input name="walletName" value={wallet.walletName} onChange={updateWallet} required /></label>
            <label>Network<input name="network" value={wallet.network} onChange={updateWallet} required /></label>
            <label>Symbol<input name="currencySymbol" value={wallet.currencySymbol} onChange={updateWallet} required /></label>
            <label className="full">Wallet address<input name="walletAddress" value={wallet.walletAddress} onChange={updateWallet} required /></label>
            <label className="full">Instructions<textarea name="instructions" value={wallet.instructions} onChange={updateWallet} /></label>
            <label className="full">QR code<input type="file" accept="image/*" onChange={(event) => setWalletQr(event.target.files[0])} /></label>
            {walletQr && (
              <p className="admin-file-summary full">
                QR image selected: {walletQr.name}
              </p>
            )}
            <div className="admin-form-actions">
              <button className="button primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editingWalletId ? 'Save wallet' : 'Create wallet'}
              </button>
              {editingWalletId && (
                <button className="button secondary dark" type="button" onClick={cancelWalletEdit}>
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <aside className="admin-panel admin-list-panel">
            <div className="admin-section-head">
              <span>{isLoading ? 'Loading' : `${filteredWallets.length} of ${wallets.length} records`}</span>
              <h2>Wallet directory</h2>
            </div>
            <label className="admin-search">
              Search wallets
              <input
                type="search"
                value={walletSearch}
                placeholder="Search name, symbol, address"
                onChange={(event) => {
                  setWalletSearch(event.target.value)
                  setWalletPage(1)
                }}
              />
            </label>
            <div className="admin-list">
              {isLoading && <SkeletonList />}
              {!isLoading && walletList.rows.map((item) => (
                  <article className="admin-media-item" key={item.id}>
                    {item.qrCodeUrl ? (
                      <img
                        className="admin-wallet-qr"
                        src={resolveAdminAssetUrl(item.qrCodeUrl)}
                        alt={`${item.walletName} QR code`}
                      />
                    ) : (
                      <span className="admin-wallet-qr empty" aria-hidden="true">QR</span>
                    )}
                    <div>
                      <strong>{item.walletName}</strong>
                      <span>{item.currencySymbol} | {item.network}</span>
                      <span className="admin-address">{item.walletAddress}</span>
                      <div className="admin-row-actions">
                        <button type="button" onClick={() => startWalletEdit(item)}>Edit</button>
                        <button type="button" className="danger" onClick={() => handleWalletDelete(item)}>Delete</button>
                      </div>
                    </div>
                  </article>
                ))}
              {!isLoading && walletList.rows.length === 0 && (
                <EmptyState message="No wallet records match your search." />
              )}
            </div>
            {!isLoading && filteredWallets.length > 0 && (
              <PaginationControls
                currentPage={walletList.currentPage}
                pageCount={walletList.pageCount}
                totalCount={filteredWallets.length}
                onPageChange={setWalletPage}
              />
            )}
          </aside>
        </div>
      )}

      {activeTab === 'Payments' && (
        <div className="admin-panel admin-table-panel">
          <div className="admin-section-head">
            <span>{isLoading ? 'Loading' : `${filteredPayments.length} of ${payments.length} payments`}</span>
            <h2>Payment review</h2>
          </div>
          <div className="admin-filter-grid">
            <label className="admin-search">
              Search payments
              <input
                type="search"
                value={paymentSearch}
                placeholder="Search buyer, email, vehicle, hash"
                onChange={(event) => {
                  setPaymentSearch(event.target.value)
                  setPaymentPage(1)
                }}
              />
            </label>
            <label className="admin-search">
              Status
              <select
                value={paymentStatusFilter}
                onChange={(event) => {
                  setPaymentStatusFilter(event.target.value)
                  setPaymentPage(1)
                }}
              >
                <option value="">All statuses</option>
                <option value="pending">Pending</option>
                <option value="submitted">Submitted</option>
                <option value="confirmed">Confirmed</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>
          {isLoading ? (
            <SkeletonList type="table" />
          ) : (
            <div className="admin-payment-list">
              {paymentList.rows.map((payment) => (
                <article className="admin-payment-card" key={payment.id}>
                  <div>
                    <strong>{payment.buyer_name}</strong>
                    <span>{payment.buyer_email}</span>
                  </div>
                  <div>
                    <strong>{priceFormatter.format(Number(payment.amount || 0))} {payment.currency_symbol}</strong>
                    <span>{payment.item_title || 'No vehicle attached'}</span>
                  </div>
                  <div>
                    <strong>{payment.status}</strong>
                    <span>{payment.transaction_hash || 'No transaction hash'}</span>
                  </div>
                  <div className="admin-row-actions">
                    <button type="button" disabled={isSubmitting} onClick={() => handlePaymentStatusChange(payment, 'confirmed')}>
                      Confirm
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={() => handlePaymentStatusChange(payment, 'rejected')}>
                      Reject
                    </button>
                    <button type="button" disabled={isSubmitting} onClick={() => emailPaymentBuyer(payment)}>
                      Email buyer
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!isLoading && paymentList.rows.length === 0 && (
            <EmptyState message="No payments match this view." />
          )}
          {!isLoading && filteredPayments.length > 0 && (
            <PaginationControls
              currentPage={paymentList.currentPage}
              pageCount={paymentList.pageCount}
              totalCount={filteredPayments.length}
              onPageChange={setPaymentPage}
            />
          )}
        </div>
      )}

      {activeTab === 'Users' && (
        <div className="admin-panel admin-table-panel">
          <div className="admin-section-head">
            <span>{isLoading ? 'Loading' : `${filteredUsers.length} of ${users.length} accounts`}</span>
            <h2>User accounts</h2>
          </div>
          <label className="admin-search">
            Search users
            <input
              type="search"
              value={userSearch}
              placeholder="Search name, email, role"
              onChange={(event) => {
                setUserSearch(event.target.value)
                setUserPage(1)
              }}
            />
          </label>
          <div className="admin-table-toolbar">
            <span>{selectedUserIds.length} selected</span>
            <div className="admin-row-actions">
              <button type="button" onClick={selectFilteredUsers} disabled={filteredUsers.length === 0}>
                Select results
              </button>
              <button type="button" onClick={clearSelectedUsers} disabled={selectedUserIds.length === 0}>
                Clear
              </button>
              <button type="button" onClick={handleEmailSelected} disabled={selectedUserIds.length === 0}>
                Email selected
              </button>
            </div>
          </div>
          {isLoading ? (
            <SkeletonList type="table" />
          ) : (
            <div className="admin-user-table">
              <div className="admin-user-row head">
                <span>Select</span>
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
                <span>Actions</span>
              </div>
              {userList.rows.map((user) => (
                <div className="admin-user-row" key={user.id}>
                  <span>
                    <input
                      aria-label={`Select ${user.email}`}
                      checked={selectedUserIds.includes(user.id)}
                      type="checkbox"
                      onChange={() => toggleUserSelection(user.id)}
                    />
                  </span>
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                  <span>{user.role}</span>
                  <span>{user.isActive ? 'Active' : 'Inactive'}</span>
                  <span>
                    <button className="table-action" type="button" onClick={() => emailUser(user)}>
                      Email
                    </button>
                    <button className="table-action" type="button" disabled={isSubmitting} onClick={() => handleUserStatusToggle(user)}>
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="table-action" type="button" disabled={isSubmitting} onClick={() => handleUserRoleToggle(user)}>
                      {user.role === 'admin' ? 'Make buyer' : 'Make admin'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
          {!isLoading && userList.rows.length === 0 && (
            <EmptyState message="No user accounts match your search." />
          )}
          {!isLoading && filteredUsers.length > 0 && (
            <PaginationControls
              currentPage={userList.currentPage}
              pageCount={userList.pageCount}
              totalCount={filteredUsers.length}
              onPageChange={setUserPage}
            />
          )}
        </div>
      )}

      {activeTab === 'Mailer' && (
        <div className="admin-workspace mailer-workspace">
          <form className="admin-panel admin-form admin-mailer-form" onSubmit={handleMailerSubmit}>
            <div className="admin-section-head">
              <span>{mailerRecipientCount} recipient{mailerRecipientCount === 1 ? '' : 's'}</span>
              <h2>Email users</h2>
            </div>

            <div className="admin-recipient-mode full" role="radiogroup" aria-label="Recipient mode">
              <label>
                <input
                  checked={mailer.recipientMode === 'manual'}
                  name="recipientMode"
                  type="radio"
                  value="manual"
                  onChange={updateMailer}
                />
                Manual email
              </label>
              <label>
                <input
                  checked={mailer.recipientMode === 'selected'}
                  name="recipientMode"
                  type="radio"
                  value="selected"
                  onChange={updateMailer}
                />
                Selected users
              </label>
              <label>
                <input
                  checked={mailer.recipientMode === 'all-active'}
                  name="recipientMode"
                  type="radio"
                  value="all-active"
                  onChange={updateMailer}
                />
                All active buyers
              </label>
            </div>

            {mailer.recipientMode === 'manual' ? (
              <label className="full">
                Recipient emails
                <textarea
                  name="emails"
                  placeholder="buyer@example.com, second@example.com"
                  value={mailer.emails}
                  onChange={updateMailer}
                  required
                />
              </label>
            ) : mailer.recipientMode === 'selected' ? (
              <div className="admin-selected-recipients full">
                <div className="admin-section-head">
                  <span>{selectedUsers.length} selected</span>
                  <h2>Selected recipients</h2>
                </div>
                {selectedUsers.length > 0 ? selectedUsers.map((user) => (
                  <span key={user.id}>{user.name} · {user.email}</span>
                )) : (
                  <p className="admin-empty">Select users from the Users tab, then return to Mailer.</p>
                )}
              </div>
            ) : (
              <div className="admin-selected-recipients full">
                <div className="admin-section-head">
                  <span>{summary.activeBuyers} active</span>
                  <h2>All active buyers</h2>
                </div>
                <p className="admin-empty">This will send to every active buyer account. You will confirm before the email is sent.</p>
              </div>
            )}

            <label className="full">
              Subject
              <input name="subject" value={mailer.subject} onChange={updateMailer} maxLength={255} required />
            </label>
            <label className="full">
              Message body
              <textarea name="body" value={mailer.body} onChange={updateMailer} required />
            </label>
            <button className="button primary" type="submit" disabled={isSubmitting || mailerRecipientCount === 0}>
              {isSubmitting ? 'Sending...' : `Send email${mailerRecipientCount > 1 ? 's' : ''}`}
            </button>
          </form>

          <aside className="admin-panel admin-list-panel admin-mailer-preview">
            <div className="admin-section-head">
              <span>Review</span>
              <h2>Message preview</h2>
            </div>
            <dl className="admin-mailer-summary">
              <div>
                <dt>Recipients</dt>
                <dd>{mailerRecipientCount}</dd>
              </div>
              <div>
                <dt>Subject</dt>
                <dd>{mailer.subject || 'No subject yet'}</dd>
              </div>
            </dl>
            <div className="admin-mailer-body-preview">
              {mailer.body || 'Write a message body to preview it here.'}
            </div>

            <div className="admin-section-head email-history-head">
              <span>{emailLogs.length} recent</span>
              <h2>Email history</h2>
            </div>
            <div className="admin-list">
              {emailLogs.map((log) => (
                <article className={`admin-email-log ${log.status}`} key={log.id}>
                  <strong>{log.subject}</strong>
                  <span>{log.recipientEmail} | {log.status}</span>
                  <span>{log.createdAt ? dateFormatter.format(new Date(log.createdAt)) : 'No date'}</span>
                  {log.errorMessage && <span className="admin-email-error">{log.errorMessage}</span>}
                </article>
              ))}
              {emailLogs.length === 0 && (
                <EmptyState message="No admin emails have been sent yet." />
              )}
            </div>
          </aside>
        </div>
      )}
    </section>
  )
}

export default AdminPage
