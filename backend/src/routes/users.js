const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { authenticate } = require('../middleware/auth')
const { query } = require('../db')
const { toUser } = require('../utils/mappers')

const router = express.Router()

router.get('/me', authenticate, asyncRoute(async (req, res) => {
  res.json({ data: toUser(req.user) })
}))

router.get('/me/bids', authenticate, asyncRoute(async (req, res) => {
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

module.exports = router
