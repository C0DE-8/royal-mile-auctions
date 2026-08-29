const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { authenticate } = require('../middleware/auth')
const { query, run } = require('../db')
const { requireFields } = require('../utils/validation')

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

  res.json({ data: rows })
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

  res.status(201).json({ data: rows[0] })
}))

module.exports = router
