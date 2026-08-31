const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { authenticate } = require('../middleware/auth')
const { receiptUpload, uploadTo } = require('../middleware/upload')
const { query, run } = require('../db')
const { requireFields } = require('../utils/validation')
const { toPayment, toWonItem } = require('../utils/mappers')

const router = express.Router()

router.use(authenticate)

router.get('/', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT p.*, a.title AS item_title, w.wallet_name, w.network, w.wallet_address
     FROM payments p
     LEFT JOIN auction_items a ON a.id = p.auction_item_id
     LEFT JOIN crypto_wallets w ON w.id = p.crypto_wallet_id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC;`,
    [req.user.id],
  )

  res.json({ data: rows.map(toPayment) })
}))

router.get('/won-items', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT
      wi.*,
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
    JOIN auction_items a ON a.id = wi.auction_item_id
    LEFT JOIN payments p ON p.id = wi.fee_payment_id
    WHERE wi.user_id = ?
    ORDER BY wi.updated_at DESC, wi.id DESC;`,
    [req.user.id],
  )

  res.json({ data: rows.map(toWonItem) })
}))

router.post('/', asyncRoute(async (req, res) => {
  requireFields(req.body, ['amount', 'currencySymbol'])
  const result = await run(
    `INSERT INTO payments (
      user_id, auction_item_id, crypto_wallet_id, amount, currency_symbol,
      transaction_hash, status, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      req.user.id,
      req.body.auctionItemId ? Number(req.body.auctionItemId) : null,
      req.body.cryptoWalletId ? Number(req.body.cryptoWalletId) : null,
      Number(req.body.amount),
      req.body.currencySymbol,
      req.body.transactionHash || null,
      req.body.transactionHash ? 'submitted' : 'pending',
      req.body.notes || null,
    ],
  )
  const rows = await query('SELECT * FROM payments WHERE id = ?;', [result.insertId])

  res.status(201).json({ data: toPayment(rows[0]) })
}))

router.post('/:id/receipt', uploadTo('payment-receipts'), receiptUpload.single('receipt'), asyncRoute(async (req, res) => {
  requireFields(req.body, ['cryptoWalletId'])

  const id = Number(req.params.id)
  const paymentRows = await query(
    `SELECT p.*, wi.user_id AS won_user_id
     FROM payments p
     LEFT JOIN won_items wi ON wi.id = p.won_item_id
     WHERE p.id = ? AND p.user_id = ?;`,
    [id, req.user.id],
  )
  const payment = paymentRows[0]

  if (!payment) {
    res.status(404).json({ error: 'Payment not found.' })
    return
  }

  if (payment.status === 'confirmed') {
    res.status(400).json({ error: 'This payment has already been confirmed.' })
    return
  }

  if (!req.file) {
    res.status(400).json({ error: 'Payment receipt is required.' })
    return
  }

  const walletRows = await query(
    'SELECT id, currency_symbol FROM crypto_wallets WHERE id = ? AND is_active = 1;',
    [Number(req.body.cryptoWalletId)],
  )
  const wallet = walletRows[0]

  if (!wallet) {
    res.status(400).json({ error: 'Choose an active payment wallet.' })
    return
  }

  const receiptUrl = `/uploads/payment-receipts/${req.file.filename}`

  await run(
    `UPDATE payments SET
      crypto_wallet_id = ?,
      currency_symbol = ?,
      transaction_hash = ?,
      receipt_url = ?,
      status = ?,
      notes = COALESCE(?, notes)
    WHERE id = ?;`,
    [
      wallet.id,
      wallet.currency_symbol,
      req.body.transactionHash || null,
      receiptUrl,
      'submitted',
      req.body.notes || null,
      id,
    ],
  )

  if (payment.won_item_id) {
    await run('UPDATE won_items SET fee_status = ?, item_status = ? WHERE id = ? AND user_id = ?;', [
      'submitted',
      'on_hold',
      payment.won_item_id,
      req.user.id,
    ])
  }

  const rows = await query(
    `SELECT p.*, a.title AS item_title, w.wallet_name, w.network, w.wallet_address
     FROM payments p
     LEFT JOIN auction_items a ON a.id = p.auction_item_id
     LEFT JOIN crypto_wallets w ON w.id = p.crypto_wallet_id
     WHERE p.id = ?;`,
    [id],
  )

  res.json({ data: toPayment(rows[0]) })
}))

module.exports = router
