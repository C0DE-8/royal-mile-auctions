import { useEffect, useMemo, useState } from 'react'
import {
  adminLogin,
  createAuctionItem,
  createCryptoWallet,
  deleteAuctionItem,
  deleteCryptoWallet,
  fetchAdminAuctionItems,
  fetchAdminCryptoWallets,
  fetchAdminUsers,
  resolveAdminAssetUrl,
  updateAuctionItem,
  updateCryptoWallet,
} from '../../api/admin.js'

const adminTabs = ['Inventory', 'Wallets', 'Users']
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

const priceFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
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

function Toast({ toast, onClose }) {
  if (!toast) {
    return null
  }

  return (
    <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
      <span>{toast.message}</span>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}>
        x
      </button>
    </div>
  )
}

function AdminAlert({ type, children }) {
  if (!children) {
    return null
  }

  return (
    <div className={`admin-alert ${type}`} role={type === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
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
  const [vehicleImage, setVehicleImage] = useState(null)
  const [walletQr, setWalletQr] = useState(null)
  const [editingVehicleId, setEditingVehicleId] = useState(null)
  const [editingWalletId, setEditingWalletId] = useState(null)
  const [auctionItems, setAuctionItems] = useState([])
  const [wallets, setWallets] = useState([])
  const [users, setUsers] = useState([])
  const [inventorySearch, setInventorySearch] = useState('')
  const [walletSearch, setWalletSearch] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [inventoryPage, setInventoryPage] = useState(1)
  const [walletPage, setWalletPage] = useState(1)
  const [userPage, setUserPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState(null)
  const [toast, setToast] = useState(null)

  const summary = useMemo(() => ({
    activeItems: auctionItems.filter((item) => item.isActive).length,
    activeWallets: wallets.filter((item) => item.isActive).length,
    admins: users.filter((user) => user.role === 'admin').length,
  }), [auctionItems, users, wallets])

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
      fetchAdminCryptoWallets(auth.token),
      fetchAdminUsers(auth.token),
    ])
      .then(([items, nextWallets, nextUsers]) => {
        if (isMounted) {
          setAuctionItems(items)
          setWallets(nextWallets)
          setUsers(nextUsers)
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
    const [items, nextWallets, nextUsers] = await Promise.all([
      fetchAdminAuctionItems(token),
      fetchAdminCryptoWallets(token),
      fetchAdminUsers(token),
    ])
    setAuctionItems(items)
    setWallets(nextWallets)
    setUsers(nextUsers)
  }

  const updateVehicle = (event) => {
    setVehicle((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const updateWallet = (event) => {
    setWallet((current) => ({ ...current, [event.target.name]: event.target.value }))
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

      const item = editingVehicleId
        ? await updateAuctionItem(auth.token, editingVehicleId, formData)
        : await createAuctionItem(auth.token, formData)
      await refreshAdminData(auth.token)
      setVehicle(defaultVehicle)
      setVehicleImage(null)
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

  const startVehicleEdit = (item) => {
    setVehicle(vehicleToForm(item))
    setVehicleImage(null)
    setEditingVehicleId(item.id)
    setAlert({ type: 'success', message: `Editing ${item.title}.` })
    window.scrollTo({ behavior: 'smooth', top: 0 })
  }

  const cancelVehicleEdit = () => {
    setVehicle(defaultVehicle)
    setVehicleImage(null)
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
            <AdminAlert type={alert?.type}>{alert?.message}</AdminAlert>
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
          <span>Payment wallets</span>
          <strong>{summary.activeWallets}</strong>
        </article>
        <article>
          <span>Admin users</span>
          <strong>{summary.admins}</strong>
        </article>
      </div>

      <AdminAlert type={alert?.type}>{alert?.message}</AdminAlert>

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
            <label className="full">Vehicle image<input type="file" accept="image/*" onChange={(event) => setVehicleImage(event.target.files[0])} /></label>
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
                      <img src={resolveAdminAssetUrl(item.imageUrl)} alt={item.title} />
                    )}
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.category} | Lane {item.lane} | {priceFormatter.format(item.auctionPrice)}</span>
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
                    {item.qrCodeUrl && (
                      <img src={resolveAdminAssetUrl(item.qrCodeUrl)} alt={`${item.walletName} QR code`} />
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
          {isLoading ? (
            <SkeletonList type="table" />
          ) : (
            <div className="admin-user-table">
              <div className="admin-user-row head">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Status</span>
              </div>
              {userList.rows.map((user) => (
                <div className="admin-user-row" key={user.id}>
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                  <span>{user.role}</span>
                  <span>{user.isActive ? 'Active' : 'Inactive'}</span>
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
    </section>
  )
}

export default AdminPage
