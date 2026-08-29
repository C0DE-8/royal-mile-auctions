const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { authenticate } = require('../middleware/auth')
const { query, run } = require('../db')
const { requireFields } = require('../utils/validation')

const router = express.Router()

router.use(authenticate)

router.get('/', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT b.*, a.title AS item_title, a.lot, a.lane
     FROM bids b
     JOIN auction_items a ON a.id = b.auction_item_id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC;`,
    [req.user.id],
  )

  res.json({ data: rows })
}))

router.post('/', asyncRoute(async (req, res) => {
  requireFields(req.body, ['auctionItemId', 'amount'])
  const result = await run(
    'INSERT INTO bids (user_id, auction_item_id, amount, status) VALUES (?, ?, ?, ?);',
    [req.user.id, Number(req.body.auctionItemId), Number(req.body.amount), 'pending'],
  )
  const rows = await query('SELECT * FROM bids WHERE id = ?;', [result.insertId])

  res.status(201).json({ data: rows[0] })
}))

module.exports = router
