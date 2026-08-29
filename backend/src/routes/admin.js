const bcrypt = require('bcryptjs')
const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { authenticate, requireAdmin } = require('../middleware/auth')
const { upload, uploadTo } = require('../middleware/upload')
const { query, run } = require('../db')
const { toAuctionItem, toUser, toWallet } = require('../utils/mappers')
const { boolToInt, requireFields } = require('../utils/validation')

const router = express.Router()

router.use(authenticate, requireAdmin)

async function findAuctionItem(id) {
  const rows = await query('SELECT * FROM auction_items WHERE id = ?;', [id])
  return rows[0]
}

async function findWallet(id) {
  const rows = await query('SELECT * FROM crypto_wallets WHERE id = ?;', [id])
  return rows[0]
}

router.get('/auction-items', asyncRoute(async (req, res) => {
  const rows = await query('SELECT * FROM auction_items ORDER BY created_at DESC, id DESC;')
  res.json({ data: rows.map(toAuctionItem) })
}))

router.post('/auction-items', uploadTo('auction-items'), upload.single('image'), asyncRoute(async (req, res) => {
  const body = req.body
  requireFields(body, [
    'year',
    'make',
    'model',
    'category',
    'miles',
    'lane',
    'lot',
    'mainPrice',
    'vin',
    'titleStatus',
    'status',
    'seller',
    'light',
    'transmission',
    'drivetrain',
    'notes',
  ])

  const imageUrl = req.file ? `/uploads/auction-items/${req.file.filename}` : body.imageUrl
  if (!imageUrl) {
    res.status(400).json({ error: 'Auction item image is required.' })
    return
  }

  const title = body.title || `${body.year} ${body.make} ${body.model}`
  const result = await run(
    `INSERT INTO auction_items (
      title, year, make, model, category, miles, lane, lot, main_price,
      discount_percent, vin, title_status, item_status, seller, light,
      transmission, drivetrain, notes, image_url, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      title,
      Number(body.year),
      body.make,
      body.model,
      body.category,
      body.miles,
      body.lane,
      body.lot,
      Number(body.mainPrice),
      Number(body.discountPercent || 60),
      body.vin,
      body.titleStatus,
      body.status,
      body.seller,
      body.light,
      body.transmission,
      body.drivetrain,
      body.notes,
      imageUrl,
      boolToInt(body.isActive),
    ],
  )

  const created = await findAuctionItem(result.insertId)
  res.status(201).json({ data: toAuctionItem(created) })
}))

router.put('/auction-items/:id', uploadTo('auction-items'), upload.single('image'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  const existing = await findAuctionItem(id)
  if (!existing) {
    res.status(404).json({ error: 'Auction item not found.' })
    return
  }

  const body = req.body
  const nextImageUrl = req.file ? `/uploads/auction-items/${req.file.filename}` : body.imageUrl || existing.image_url
  await run(
    `UPDATE auction_items SET
      title = ?,
      year = ?,
      make = ?,
      model = ?,
      category = ?,
      miles = ?,
      lane = ?,
      lot = ?,
      main_price = ?,
      discount_percent = ?,
      vin = ?,
      title_status = ?,
      item_status = ?,
      seller = ?,
      light = ?,
      transmission = ?,
      drivetrain = ?,
      notes = ?,
      image_url = ?,
      is_active = ?
    WHERE id = ?;`,
    [
      body.title || existing.title,
      Number(body.year || existing.year),
      body.make || existing.make,
      body.model || existing.model,
      body.category || existing.category,
      body.miles || existing.miles,
      body.lane || existing.lane,
      body.lot || existing.lot,
      Number(body.mainPrice || existing.main_price),
      Number(body.discountPercent || existing.discount_percent),
      body.vin || existing.vin,
      body.titleStatus || existing.title_status,
      body.status || existing.item_status,
      body.seller || existing.seller,
      body.light || existing.light,
      body.transmission || existing.transmission,
      body.drivetrain || existing.drivetrain,
      body.notes || existing.notes,
      nextImageUrl,
      body.isActive === undefined ? existing.is_active : boolToInt(body.isActive),
      id,
    ],
  )

  const updated = await findAuctionItem(id)
  res.json({ data: toAuctionItem(updated) })
}))

router.delete('/auction-items/:id', asyncRoute(async (req, res) => {
  await run('DELETE FROM auction_items WHERE id = ?;', [Number(req.params.id)])
  res.status(204).send()
}))

router.get('/crypto-wallets', asyncRoute(async (req, res) => {
  const rows = await query('SELECT * FROM crypto_wallets ORDER BY currency_symbol, wallet_name;')
  res.json({ data: rows.map(toWallet) })
}))

router.post('/crypto-wallets', uploadTo('wallet-qr'), upload.single('qrCode'), asyncRoute(async (req, res) => {
  const body = req.body
  requireFields(body, ['walletName', 'network', 'currencySymbol', 'walletAddress'])
  const qrCodeUrl = req.file ? `/uploads/wallet-qr/${req.file.filename}` : body.qrCodeUrl

  if (!qrCodeUrl) {
    res.status(400).json({ error: 'Wallet QR code image is required.' })
    return
  }

  const result = await run(
    `INSERT INTO crypto_wallets (
      wallet_name, network, currency_symbol, wallet_address, qr_code_url, instructions, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      body.walletName,
      body.network,
      body.currencySymbol,
      body.walletAddress,
      qrCodeUrl,
      body.instructions || null,
      boolToInt(body.isActive),
    ],
  )

  const created = await findWallet(result.insertId)
  res.status(201).json({ data: toWallet(created) })
}))

router.put('/crypto-wallets/:id', uploadTo('wallet-qr'), upload.single('qrCode'), asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  const existing = await findWallet(id)
  if (!existing) {
    res.status(404).json({ error: 'Crypto wallet not found.' })
    return
  }

  const body = req.body
  const nextQrCodeUrl = req.file ? `/uploads/wallet-qr/${req.file.filename}` : body.qrCodeUrl || existing.qr_code_url
  await run(
    `UPDATE crypto_wallets SET
      wallet_name = ?,
      network = ?,
      currency_symbol = ?,
      wallet_address = ?,
      qr_code_url = ?,
      instructions = ?,
      is_active = ?
    WHERE id = ?;`,
    [
      body.walletName || existing.wallet_name,
      body.network || existing.network,
      body.currencySymbol || existing.currency_symbol,
      body.walletAddress || existing.wallet_address,
      nextQrCodeUrl,
      body.instructions || existing.instructions,
      body.isActive === undefined ? existing.is_active : boolToInt(body.isActive),
      id,
    ],
  )

  const updated = await findWallet(id)
  res.json({ data: toWallet(updated) })
}))

router.delete('/crypto-wallets/:id', asyncRoute(async (req, res) => {
  await run('DELETE FROM crypto_wallets WHERE id = ?;', [Number(req.params.id)])
  res.status(204).send()
}))

router.get('/users', asyncRoute(async (req, res) => {
  const rows = await query('SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users ORDER BY created_at DESC;')
  res.json({ data: rows.map(toUser) })
}))

router.post('/users', asyncRoute(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password', 'role'])
  const passwordHash = await bcrypt.hash(req.body.password, 10)
  const result = await run(
    'INSERT INTO users (name, email, password_hash, role, phone, is_active) VALUES (?, ?, ?, ?, ?, ?);',
    [
      req.body.name,
      req.body.email.toLowerCase(),
      passwordHash,
      req.body.role,
      req.body.phone || null,
      boolToInt(req.body.isActive),
    ],
  )
  const rows = await query(
    'SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users WHERE id = ?;',
    [result.insertId],
  )

  res.status(201).json({ data: toUser(rows[0]) })
}))

router.patch('/users/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  const rows = await query('SELECT * FROM users WHERE id = ?;', [id])
  const existing = rows[0]

  if (!existing) {
    res.status(404).json({ error: 'User not found.' })
    return
  }

  const passwordHash = req.body.password
    ? await bcrypt.hash(req.body.password, 10)
    : existing.password_hash

  await run(
    `UPDATE users SET
      name = ?,
      email = ?,
      password_hash = ?,
      role = ?,
      phone = ?,
      is_active = ?
    WHERE id = ?;`,
    [
      req.body.name || existing.name,
      (req.body.email || existing.email).toLowerCase(),
      passwordHash,
      req.body.role || existing.role,
      req.body.phone || existing.phone,
      req.body.isActive === undefined ? existing.is_active : boolToInt(req.body.isActive),
      id,
    ],
  )

  const updated = await query(
    'SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users WHERE id = ?;',
    [id],
  )
  res.json({ data: toUser(updated[0]) })
}))

module.exports = router
