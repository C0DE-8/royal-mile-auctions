import { useState } from 'react'
import { adminLogin, createAuctionItem, createCryptoWallet } from '../../api/admin.js'

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
  status: '',
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

function AdminPage() {
  const [auth, setAuth] = useState(null)
  const [login, setLogin] = useState({
    email: 'admin@royalmileauctions.com',
    password: 'AdminPass123!',
  })
  const [vehicle, setVehicle] = useState(defaultVehicle)
  const [wallet, setWallet] = useState(defaultWallet)
  const [vehicleImage, setVehicleImage] = useState(null)
  const [walletQr, setWalletQr] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const updateVehicle = (event) => {
    setVehicle((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const updateWallet = (event) => {
    setWallet((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const nextAuth = await adminLogin(login.email, login.password)
      setAuth(nextAuth)
      setMessage(`Signed in as ${nextAuth.user.name}`)
    } catch (nextError) {
      setError(nextError.message)
    }
  }

  const handleVehicleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const formData = new FormData()
      Object.entries(vehicle).forEach(([key, value]) => formData.append(key, value))
      if (vehicleImage) {
        formData.append('image', vehicleImage)
      }

      const item = await createAuctionItem(auth.token, formData)
      setVehicle(defaultVehicle)
      setVehicleImage(null)
      event.target.reset()
      setMessage(`Auction item created: ${item.title}`)
    } catch (nextError) {
      setError(nextError.message)
    }
  }

  const handleWalletSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    try {
      const formData = new FormData()
      Object.entries(wallet).forEach(([key, value]) => formData.append(key, value))
      if (walletQr) {
        formData.append('qrCode', walletQr)
      }

      const item = await createCryptoWallet(auth.token, formData)
      setWallet(defaultWallet)
      setWalletQr(null)
      event.target.reset()
      setMessage(`Wallet created: ${item.walletName}`)
    } catch (nextError) {
      setError(nextError.message)
    }
  }

  if (!auth) {
    return (
      <section className="page-shell admin-shell">
        <div className="page-intro compact">
          <p className="eyebrow">Admin</p>
          <h1>Manage auction inventory and wallet details.</h1>
        </div>
        <form className="admin-form narrow" onSubmit={handleLogin}>
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
          <button className="button primary" type="submit">Sign in</button>
          {message && <p className="form-message">{message}</p>}
          {error && <p className="form-error">{error}</p>}
        </form>
      </section>
    )
  }

  return (
    <section className="page-shell admin-shell">
      <div className="page-intro compact">
        <p className="eyebrow">Admin</p>
        <h1>Upload auction items and crypto wallets.</h1>
        <p>Signed in as {auth.user.name}</p>
      </div>

      <div className="admin-grid">
        <form className="admin-form" onSubmit={handleVehicleSubmit}>
          <h2>Auction item</h2>
          <label>Year<input name="year" value={vehicle.year} onChange={updateVehicle} /></label>
          <label>Make<input name="make" value={vehicle.make} onChange={updateVehicle} /></label>
          <label>Model<input name="model" value={vehicle.model} onChange={updateVehicle} /></label>
          <label>
            Category
            <select name="category" value={vehicle.category} onChange={updateVehicle}>
              <option>Cars</option>
              <option>Trucks</option>
              <option>SUVs</option>
            </select>
          </label>
          <label>Miles<input name="miles" value={vehicle.miles} onChange={updateVehicle} /></label>
          <label>Lane<input name="lane" value={vehicle.lane} onChange={updateVehicle} /></label>
          <label>Lot<input name="lot" value={vehicle.lot} onChange={updateVehicle} /></label>
          <label>Main price<input name="mainPrice" value={vehicle.mainPrice} onChange={updateVehicle} /></label>
          <label>Discount %<input name="discountPercent" value={vehicle.discountPercent} onChange={updateVehicle} /></label>
          <label>VIN<input name="vin" value={vehicle.vin} onChange={updateVehicle} /></label>
          <label>Title status<input name="titleStatus" value={vehicle.titleStatus} onChange={updateVehicle} /></label>
          <label>Status<input name="status" value={vehicle.status} onChange={updateVehicle} /></label>
          <label>Seller<input name="seller" value={vehicle.seller} onChange={updateVehicle} /></label>
          <label>Light<input name="light" value={vehicle.light} onChange={updateVehicle} /></label>
          <label>Transmission<input name="transmission" value={vehicle.transmission} onChange={updateVehicle} /></label>
          <label>Drivetrain<input name="drivetrain" value={vehicle.drivetrain} onChange={updateVehicle} /></label>
          <label className="full">Notes<textarea name="notes" value={vehicle.notes} onChange={updateVehicle} /></label>
          <label className="full">Vehicle image<input type="file" accept="image/*" onChange={(event) => setVehicleImage(event.target.files[0])} /></label>
          <button className="button primary" type="submit">Create item</button>
        </form>

        <form className="admin-form" onSubmit={handleWalletSubmit}>
          <h2>Crypto wallet</h2>
          <label>Wallet name<input name="walletName" value={wallet.walletName} onChange={updateWallet} /></label>
          <label>Network<input name="network" value={wallet.network} onChange={updateWallet} /></label>
          <label>Symbol<input name="currencySymbol" value={wallet.currencySymbol} onChange={updateWallet} /></label>
          <label className="full">Wallet address<input name="walletAddress" value={wallet.walletAddress} onChange={updateWallet} /></label>
          <label className="full">Instructions<textarea name="instructions" value={wallet.instructions} onChange={updateWallet} /></label>
          <label className="full">QR code<input type="file" accept="image/*" onChange={(event) => setWalletQr(event.target.files[0])} /></label>
          <button className="button primary" type="submit">Create wallet</button>
        </form>
      </div>

      {message && <p className="form-message">{message}</p>}
      {error && <p className="form-error">{error}</p>}
    </section>
  )
}

export default AdminPage
