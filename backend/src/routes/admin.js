const bcrypt = require('bcryptjs')
const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { authenticate, requireAdmin } = require('../middleware/auth')
const { upload, uploadTo } = require('../middleware/upload')
const { query, run } = require('../db')
const { sendMail } = require('../services/mailer')
const { toAuctionItem, toEmailLog, toPayment, toUser, toWallet, toWonItem } = require('../utils/mappers')
const { boolToInt, requireFields } = require('../utils/validation')

const router = express.Router()
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

router.use(authenticate, requireAdmin)

const auctionItemSelect = `
  SELECT
    ai.*,
    gallery.gallery_images
  FROM auction_items ai
  LEFT JOIN (
    SELECT
      auction_item_id,
      GROUP_CONCAT(image_url ORDER BY sort_order, id SEPARATOR ',') AS gallery_images
    FROM auction_item_images
    GROUP BY auction_item_id
  ) gallery ON gallery.auction_item_id = ai.id
`

async function findAuctionItem(id) {
  const rows = await query(`
    ${auctionItemSelect}
    WHERE ai.id = ?
  `, [id])
  return rows[0]
}

async function addAuctionItemImages(auctionItemId, files = []) {
  if (files.length === 0) {
    return
  }

  const rows = await query(
    'SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder FROM auction_item_images WHERE auction_item_id = ?;',
    [auctionItemId],
  )
  const nextSortOrder = Number(rows[0]?.maxSortOrder || 0) + 1

  await Promise.all(files.map((file, index) => run(
    'INSERT INTO auction_item_images (auction_item_id, image_url, sort_order) VALUES (?, ?, ?);',
    [auctionItemId, `/uploads/auction-items/${file.filename}`, nextSortOrder + index],
  )))
}

async function findWallet(id) {
  const rows = await query('SELECT * FROM crypto_wallets WHERE id = ?;', [id])
  return rows[0]
}

async function findWonItem(id) {
  const rows = await query(
    `SELECT
      wi.*,
      u.name AS buyer_name,
      u.email AS buyer_email,
      a.title,
      a.year,
      a.make,
      a.model,
      a.image_url,
      a.lane,
      a.lot,
      p.receipt_url,
      p.status AS payment_status
    FROM won_items wi
    JOIN users u ON u.id = wi.user_id
    JOIN auction_items a ON a.id = wi.auction_item_id
    LEFT JOIN payments p ON p.id = wi.fee_payment_id
    WHERE wi.id = ?;`,
    [id],
  )
  return rows[0]
}

function normalizeEmails(emails = []) {
  const values = Array.isArray(emails) ? emails : String(emails).split(',')
  const seen = new Set()

  return values
    .map((email) => String(email || '').trim().toLowerCase())
    .filter((email) => {
      if (!email || seen.has(email) || !emailPattern.test(email)) {
        return false
      }

      seen.add(email)
      return true
    })
}

function toBid(row) {
  return {
    ...row,
    bidder_id: row.user_id,
    bidder_name: row.bidder_name,
    bidder_email: row.bidder_email,
    item_title: row.item_title,
  }
}

function getInvalidEmails(emails = []) {
  const values = Array.isArray(emails) ? emails : String(emails).split(',')

  return values
    .map((email) => String(email || '').trim().toLowerCase())
    .filter((email) => email && !emailPattern.test(email))
}

async function getUsersByIds(userIds = []) {
  const ids = [...new Set((Array.isArray(userIds) ? userIds : [userIds])
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0))]

  if (ids.length === 0) {
    return []
  }

  const placeholders = ids.map(() => '?').join(', ')
  return query(
    `SELECT id, name, email FROM users WHERE is_active = 1 AND id IN (${placeholders});`,
    ids,
  )
}

async function getAllActiveBuyerUsers() {
  return query(
    "SELECT id, name, email FROM users WHERE is_active = 1 AND role = 'user' ORDER BY created_at DESC;",
  )
}

async function logEmailAttempt({ adminUserId, body, errorMessage, providerMessageId, recipientEmail, recipientUserId, status, subject }) {
  await run(
    `INSERT INTO email_logs (
      admin_user_id, recipient_email, recipient_user_id, subject, body,
      status, error_message, provider_message_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      adminUserId,
      recipientEmail,
      recipientUserId || null,
      subject,
      body,
      status,
      errorMessage || null,
      providerMessageId || null,
    ],
  )
}

router.get('/metrics', asyncRoute(async (req, res) => {
  const rows = await query(`
    SELECT
      (SELECT COUNT(*) FROM auction_items WHERE is_active = 1) AS active_items,
      (SELECT COUNT(*) FROM crypto_wallets WHERE is_active = 1) AS active_wallets,
      (SELECT COUNT(*) FROM users WHERE role = 'admin') AS admins,
      (SELECT COUNT(*) FROM users) AS total_users,
      (SELECT COUNT(*) FROM users WHERE role = 'user' AND is_active = 1) AS active_buyers,
      (SELECT COUNT(*) FROM bids WHERE status IN ('pending', 'winning')) AS active_bids,
      (SELECT COUNT(*) FROM payments WHERE status IN ('pending', 'submitted')) AS pending_payments,
      (SELECT COUNT(*) FROM won_items WHERE item_status = 'on_hold') AS held_items,
      (SELECT COUNT(*) FROM auction_items WHERE is_active = 0 OR LOWER(item_status) LIKE 'closed%') AS closed_auctions,
      (SELECT COUNT(*) FROM email_logs WHERE status = 'sent') AS sent_emails,
      (SELECT COUNT(*) FROM email_logs WHERE status = 'failed') AS failed_emails;
  `)

  const metrics = rows[0]
  res.json({
    data: {
      activeBids: Number(metrics.active_bids || 0),
      activeBuyers: Number(metrics.active_buyers || 0),
      activeItems: Number(metrics.active_items || 0),
      activeWallets: Number(metrics.active_wallets || 0),
      admins: Number(metrics.admins || 0),
      closedAuctions: Number(metrics.closed_auctions || 0),
      failedEmails: Number(metrics.failed_emails || 0),
      heldItems: Number(metrics.held_items || 0),
      pendingPayments: Number(metrics.pending_payments || 0),
      sentEmails: Number(metrics.sent_emails || 0),
      totalUsers: Number(metrics.total_users || 0),
    },
  })
}))

router.get('/auction-items', asyncRoute(async (req, res) => {
  const rows = await query(`
    ${auctionItemSelect}
    ORDER BY ai.created_at DESC, ai.id DESC;
  `)
  res.json({ data: rows.map(toAuctionItem) })
}))

router.get('/bids', asyncRoute(async (req, res) => {
  const params = []
  const where = []

  if (req.query.auctionItemId) {
    where.push('b.auction_item_id = ?')
    params.push(Number(req.query.auctionItemId))
  }

  const rows = await query(
    `SELECT
      b.*,
      u.name AS bidder_name,
      u.email AS bidder_email,
      a.title AS item_title,
      a.lot,
      a.lane
    FROM bids b
    JOIN users u ON u.id = b.user_id
    JOIN auction_items a ON a.id = b.auction_item_id
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY b.created_at DESC, b.id DESC;`,
    params,
  )

  res.json({ data: rows.map(toBid) })
}))

router.get('/won-items', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT
      wi.*,
      u.name AS buyer_name,
      u.email AS buyer_email,
      a.title,
      a.year,
      a.make,
      a.model,
      a.image_url,
      a.lane,
      a.lot,
      p.receipt_url,
      p.status AS payment_status
    FROM won_items wi
    JOIN users u ON u.id = wi.user_id
    JOIN auction_items a ON a.id = wi.auction_item_id
    LEFT JOIN payments p ON p.id = wi.fee_payment_id
    ORDER BY wi.updated_at DESC, wi.id DESC;`,
  )

  res.json({ data: rows.map(toWonItem) })
}))

router.patch('/won-items/:id', asyncRoute(async (req, res) => {
  const allowedStatuses = ['on_hold', 'pending', 'processing', 'docs_in_transit', 'delivered']
  const id = Number(req.params.id)

  if (!allowedStatuses.includes(req.body.itemStatus)) {
    res.status(400).json({ error: 'Invalid item status.' })
    return
  }

  const existing = await findWonItem(id)
  if (!existing) {
    res.status(404).json({ error: 'Won item not found.' })
    return
  }

  if (existing.fee_status !== 'confirmed' && req.body.itemStatus !== 'on_hold') {
    res.status(400).json({ error: 'Confirm the auction fee before moving this item out of hold.' })
    return
  }

  await run('UPDATE won_items SET item_status = ?, admin_notes = COALESCE(?, admin_notes) WHERE id = ?;', [
    req.body.itemStatus,
    req.body.adminNotes || null,
    id,
  ])

  res.json({ data: toWonItem(await findWonItem(id)) })
}))

router.get('/payments', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT
      p.*,
      u.name AS buyer_name,
      u.email AS buyer_email,
      a.title AS item_title,
      a.lot,
      a.lane,
      w.wallet_name,
      w.network,
      w.wallet_address
    FROM payments p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN auction_items a ON a.id = p.auction_item_id
    LEFT JOIN crypto_wallets w ON w.id = p.crypto_wallet_id
    ORDER BY p.created_at DESC, p.id DESC;`,
  )

  res.json({ data: rows })
}))

router.patch('/payments/:id', asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  const allowedStatuses = ['pending', 'submitted', 'confirmed', 'rejected', 'cancelled']

  if (!allowedStatuses.includes(req.body.status)) {
    res.status(400).json({ error: 'Invalid payment status.' })
    return
  }

  const existing = await query('SELECT id FROM payments WHERE id = ?;', [id])
  if (!existing[0]) {
    res.status(404).json({ error: 'Payment not found.' })
    return
  }

  await run('UPDATE payments SET status = ?, notes = COALESCE(?, notes) WHERE id = ?;', [
    req.body.status,
    req.body.notes || null,
    id,
  ])

  const paymentRows = await query('SELECT won_item_id FROM payments WHERE id = ?;', [id])
  const wonItemId = paymentRows[0]?.won_item_id

  if (wonItemId) {
    const nextFeeStatus = req.body.status === 'confirmed'
      ? 'confirmed'
      : req.body.status === 'rejected'
        ? 'rejected'
        : req.body.status === 'submitted'
          ? 'submitted'
          : 'pending'
    const nextItemStatus = nextFeeStatus === 'confirmed' ? 'pending' : 'on_hold'

    await run('UPDATE won_items SET fee_status = ?, item_status = ? WHERE id = ?;', [
      nextFeeStatus,
      nextItemStatus,
      wonItemId,
    ])
  }

  const rows = await query(
    `SELECT
      p.*,
      u.name AS buyer_name,
      u.email AS buyer_email,
      a.title AS item_title,
      a.lot,
      a.lane,
      w.wallet_name,
      w.network,
      w.wallet_address
    FROM payments p
    JOIN users u ON u.id = p.user_id
    LEFT JOIN auction_items a ON a.id = p.auction_item_id
    LEFT JOIN crypto_wallets w ON w.id = p.crypto_wallet_id
    WHERE p.id = ?;`,
    [id],
  )

  res.json({ data: toPayment(rows[0]) })
}))

router.post('/bids/demo', asyncRoute(async (req, res) => {
  requireFields(req.body, ['auctionItemId', 'amount'])

  const auctionItemId = Number(req.body.auctionItemId)
  const amount = Number(req.body.amount)
  const bidderUserId = Number(req.body.bidderUserId || 0)
  const bidderName = String(req.body.bidderName || '').trim()
  const bidderEmail = String(req.body.bidderEmail || '').trim().toLowerCase()
  const itemRows = await query(
    'SELECT id, main_price, discount_percent, is_active, item_status FROM auction_items WHERE id = ?;',
    [auctionItemId],
  )
  const item = itemRows[0]

  if (!item) {
    res.status(404).json({ error: 'Auction item not found.' })
    return
  }

  if (!item.is_active || String(item.item_status).toLowerCase().startsWith('closed')) {
    res.status(400).json({ error: 'This auction is closed.' })
    return
  }

  const highBidRows = await query(
    'SELECT COALESCE(MAX(amount), 0) AS currentHighBid FROM bids WHERE auction_item_id = ?;',
    [auctionItemId],
  )
  const currentHighBid = Number(highBidRows[0]?.currentHighBid || 0)
  const openingBid = Math.round(Number(item.main_price) * (1 - Number(item.discount_percent || 0) / 100))
  const minimumNextBid = currentHighBid > 0 ? currentHighBid + 100 : openingBid

  if (!Number.isFinite(amount) || amount < minimumNextBid) {
    res.status(400).json({
      error: `Bid must be at least $${minimumNextBid.toLocaleString('en-US')}.`,
      currentHighBid,
      minimumNextBid,
    })
    return
  }

  let bidder = null

  if (bidderUserId) {
    const userRows = await query(
      "SELECT id, name, email FROM users WHERE id = ? AND role = 'user' AND is_active = 1;",
      [bidderUserId],
    )
    bidder = userRows[0] || null

    if (!bidder) {
      res.status(404).json({ error: 'Selected bidder was not found or is inactive.' })
      return
    }
  } else if (bidderEmail) {
    const userRows = await query(
      "SELECT id, name, email FROM users WHERE email = ? AND role = 'user' LIMIT 1;",
      [bidderEmail],
    )
    bidder = userRows[0] || null
  }

  if (!bidder) {
    if (!bidderName) {
      res.status(400).json({ error: 'Bidder name is required when creating a new demo bidder.' })
      return
    }

    const email = bidderEmail || `${bidderName.replace(/[^a-z0-9]+/gi, '.').toLowerCase()}-${Date.now()}@demo.local`
    const passwordHash = await bcrypt.hash('123456', 10)

    const userResult = await run(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?);',
      [bidderName, email.toLowerCase(), passwordHash, 'user', req.body.phone || null],
    )
    bidder = {
      id: userResult.insertId,
      name: bidderName,
      email: email.toLowerCase(),
    }
  }

  const bidResult = await run(
    'INSERT INTO bids (user_id, auction_item_id, amount, status) VALUES (?, ?, ?, ?);',
    [bidder.id, auctionItemId, amount, req.body.status || 'pending'],
  )
  const rows = await query(
    `SELECT b.*, u.name AS bidder_name, u.email AS bidder_email, a.title AS item_title, a.lot, a.lane
     FROM bids b
     JOIN users u ON u.id = b.user_id
     JOIN auction_items a ON a.id = b.auction_item_id
     WHERE b.id = ?;`,
    [bidResult.insertId],
  )

  res.status(201).json({ data: rows[0] })
}))

router.post('/auction-items/:id/close', asyncRoute(async (req, res) => {
  const auctionItemId = Number(req.params.id)
  const existing = await findAuctionItem(auctionItemId)

  if (!existing) {
    res.status(404).json({ error: 'Auction item not found.' })
    return
  }

  const bids = await query(
    `SELECT b.*, u.name AS bidder_name, u.email AS bidder_email
     FROM bids b
     JOIN users u ON u.id = b.user_id
     WHERE b.auction_item_id = ?
     ORDER BY b.amount DESC, b.created_at ASC, b.id ASC;`,
    [auctionItemId],
  )

  if (!bids[0]) {
    res.status(400).json({ error: 'Cannot close an auction with no bids.' })
    return
  }

  const winningBid = bids[0]
  await run('UPDATE bids SET status = ? WHERE auction_item_id = ?;', ['lost', auctionItemId])
  await run('UPDATE bids SET status = ? WHERE id = ?;', ['won', winningBid.id])
  await run('UPDATE auction_items SET item_status = ?, is_active = ? WHERE id = ?;', [
    `Closed - won by ${winningBid.bidder_name}`,
    0,
    auctionItemId,
  ])

  const feeAmount = Number(existing.auction_fee || 0)
  await run(
    `INSERT INTO won_items (
      user_id, auction_item_id, winning_bid_id, winning_amount, fee_amount,
      fee_status, item_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      user_id = VALUES(user_id),
      winning_bid_id = VALUES(winning_bid_id),
      winning_amount = VALUES(winning_amount),
      fee_amount = VALUES(fee_amount),
      fee_status = IF(fee_status = 'confirmed', fee_status, VALUES(fee_status)),
      item_status = IF(fee_status = 'confirmed', item_status, VALUES(item_status));`,
    [
      winningBid.user_id,
      auctionItemId,
      winningBid.id,
      Number(winningBid.amount),
      feeAmount,
      feeAmount > 0 ? 'pending' : 'confirmed',
      feeAmount > 0 ? 'on_hold' : 'pending',
    ],
  )

  const wonItemRows = await query('SELECT id, fee_payment_id FROM won_items WHERE auction_item_id = ?;', [auctionItemId])
  const wonItemId = wonItemRows[0].id
  const existingFeePayments = await query(
    "SELECT id FROM payments WHERE won_item_id = ? AND payment_type = 'auction_fee' ORDER BY id ASC LIMIT 1;",
    [wonItemId],
  )

  if (feeAmount > 0 && !existingFeePayments[0]) {
    const paymentResult = await run(
      `INSERT INTO payments (
        user_id, auction_item_id, won_item_id, amount, currency_symbol,
        payment_type, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        winningBid.user_id,
        auctionItemId,
        wonItemId,
        feeAmount,
        'USD',
        'auction_fee',
        'pending',
        'Auction fee due before item processing.',
      ],
    )
    await run('UPDATE won_items SET fee_payment_id = ? WHERE id = ?;', [paymentResult.insertId, wonItemId])
  }

  const item = await findAuctionItem(auctionItemId)
  const wonItem = await findWonItem(wonItemId)
  res.json({
    data: {
      item: toAuctionItem(item),
      winningBid: {
        ...winningBid,
        status: 'won',
      },
      wonItem: toWonItem(wonItem),
    },
  })
}))

router.post('/auction-items', uploadTo('auction-items'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 12 },
]), asyncRoute(async (req, res) => {
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
    'auctionFee',
    'vin',
    'titleStatus',
    'status',
    'seller',
    'light',
    'transmission',
    'drivetrain',
    'notes',
  ])

  const primaryImage = req.files?.image?.[0]
  const galleryImages = req.files?.images || []
  const imageUrl = primaryImage ? `/uploads/auction-items/${primaryImage.filename}` : body.imageUrl
  if (!imageUrl) {
    res.status(400).json({ error: 'Auction item image is required.' })
    return
  }

  const title = body.title || `${body.year} ${body.make} ${body.model}`
  const result = await run(
    `INSERT INTO auction_items (
      title, year, make, model, category, miles, lane, lot, main_price,
      auction_fee, discount_percent, vin, title_status, item_status, seller, light,
      transmission, drivetrain, notes, image_url, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
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
      Number(body.auctionFee || 0),
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
  await addAuctionItemImages(result.insertId, galleryImages)
  const createdWithImages = await findAuctionItem(result.insertId)
  res.status(201).json({ data: toAuctionItem(createdWithImages || created) })
}))

router.put('/auction-items/:id', uploadTo('auction-items'), upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 12 },
]), asyncRoute(async (req, res) => {
  const id = Number(req.params.id)
  const existing = await findAuctionItem(id)
  if (!existing) {
    res.status(404).json({ error: 'Auction item not found.' })
    return
  }

  const body = req.body
  const primaryImage = req.files?.image?.[0]
  const galleryImages = req.files?.images || []
  const nextImageUrl = primaryImage ? `/uploads/auction-items/${primaryImage.filename}` : body.imageUrl || existing.image_url
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
      auction_fee = ?,
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
      Number(body.auctionFee ?? existing.auction_fee),
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

  await addAuctionItemImages(id, galleryImages)
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

router.get('/emails', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT
      el.*,
      admin.name AS admin_name,
      recipient.name AS recipient_name
    FROM email_logs el
    JOIN users admin ON admin.id = el.admin_user_id
    LEFT JOIN users recipient ON recipient.id = el.recipient_user_id
    ORDER BY el.created_at DESC, el.id DESC
    LIMIT 50;`,
  )

  res.json({ data: rows.map(toEmailLog) })
}))

router.post('/emails/send', asyncRoute(async (req, res) => {
  requireFields(req.body, ['subject', 'body'])

  const subject = String(req.body.subject).trim()
  const body = String(req.body.body).trim()

  if (!subject || !body) {
    res.status(400).json({ error: 'Email subject and message body are required.' })
    return
  }

  if (subject.length > 255) {
    res.status(400).json({ error: 'Email subject must be 255 characters or less.' })
    return
  }

  const recipientMode = req.body.recipientMode || 'manual'
  const manualEmails = recipientMode === 'manual' ? normalizeEmails(req.body.emails) : []
  const invalidEmails = recipientMode === 'manual' ? getInvalidEmails(req.body.emails) : []

  if (invalidEmails.length > 0) {
    res.status(400).json({ error: `Invalid recipient email: ${invalidEmails[0]}` })
    return
  }

  const users = recipientMode === 'all-active'
    ? await getAllActiveBuyerUsers()
    : await getUsersByIds(req.body.userIds)
  const recipientsByEmail = new Map()

  manualEmails.forEach((email) => {
    recipientsByEmail.set(email, { email, userId: null })
  })
  users.forEach((user) => {
    recipientsByEmail.set(user.email.toLowerCase(), { email: user.email.toLowerCase(), userId: user.id })
  })

  const recipients = Array.from(recipientsByEmail.values())

  if (recipients.length === 0) {
    res.status(400).json({ error: 'Add at least one valid recipient email or select active users.' })
    return
  }

  if (recipients.length > 100) {
    res.status(400).json({ error: 'Send to 100 or fewer recipients at a time.' })
    return
  }

  const results = []

  for (const recipient of recipients) {
    try {
      const sent = await sendMail({
        body,
        subject,
        to: recipient.email,
      })

      await logEmailAttempt({
        adminUserId: req.user.id,
        body,
        providerMessageId: sent.messageId,
        recipientEmail: recipient.email,
        recipientUserId: recipient.userId,
        status: 'sent',
        subject,
      })

      results.push({ email: recipient.email, status: 'sent' })
    } catch (error) {
      await logEmailAttempt({
        adminUserId: req.user.id,
        body,
        errorMessage: error.message,
        recipientEmail: recipient.email,
        recipientUserId: recipient.userId,
        status: 'failed',
        subject,
      })

      results.push({ email: recipient.email, error: error.message, status: 'failed' })
    }
  }

  const sentCount = results.filter((result) => result.status === 'sent').length
  const failed = results.filter((result) => result.status === 'failed')

  res.status(sentCount > 0 ? 200 : 503).json({
    data: {
      failedCount: failed.length,
      failedRecipients: failed,
      skippedInvalidEmails: invalidEmails,
      sentCount,
      totalRequested: recipients.length,
    },
  })
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

  if (existing.id === req.user.id && req.body.isActive === false) {
    res.status(400).json({ error: 'You cannot deactivate your own admin account.' })
    return
  }

  if (existing.id === req.user.id && req.body.role && req.body.role !== 'admin') {
    res.status(400).json({ error: 'You cannot remove admin access from your own account.' })
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
