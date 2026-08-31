const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { authenticate } = require('../middleware/auth')
const { query, run } = require('../db')
const { requireFields } = require('../utils/validation')

const router = express.Router()
const minimumBidIncrement = 100

function getAuctionPrice(item) {
  return Math.round(Number(item.main_price) * (1 - Number(item.discount_percent || 0) / 100))
}

async function getAuctionBidSummary(auctionItemId) {
  const itemRows = await query(
    'SELECT id, main_price, discount_percent FROM auction_items WHERE id = ?;',
    [auctionItemId],
  )
  const item = itemRows[0]

  if (!item) {
    return null
  }

  const highBidRows = await query(
    'SELECT COALESCE(MAX(amount), 0) AS currentHighBid FROM bids WHERE auction_item_id = ?;',
    [auctionItemId],
  )
  const currentHighBid = Number(highBidRows[0]?.currentHighBid || 0)
  const openingBid = getAuctionPrice(item)

  return {
    currentHighBid,
    minimumNextBid: currentHighBid > 0 ? currentHighBid + minimumBidIncrement : openingBid,
    openingBid,
  }
}

router.use(authenticate)

router.get('/', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT
       b.*,
       a.title AS item_title,
       a.year,
       a.make,
       a.model,
       a.image_url,
       a.main_price,
       a.discount_percent,
       a.lot,
       a.lane,
       a.miles,
       a.item_status
     FROM bids b
     JOIN auction_items a ON a.id = b.auction_item_id
     WHERE b.user_id = ?
     ORDER BY b.created_at DESC;`,
    [req.user.id],
  )

  res.json({ data: rows })
}))

router.get('/auction-item/:id', asyncRoute(async (req, res) => {
  const rows = await query(
    `SELECT
       b.id,
       b.amount,
       b.status,
       b.created_at,
       u.name AS bidder_name,
       b.user_id = ? AS is_current_user
     FROM bids b
     JOIN users u ON u.id = b.user_id
     WHERE b.auction_item_id = ?
     ORDER BY b.amount DESC, b.created_at ASC;`,
    [req.user.id, Number(req.params.id)],
  )

  res.json({ data: rows })
}))

router.get('/auction-item/:id/summary', asyncRoute(async (req, res) => {
  const auctionItemId = Number(req.params.id)
  const summary = await getAuctionBidSummary(auctionItemId)

  if (!summary) {
    res.status(404).json({ error: 'Auction item not found.' })
    return
  }

  const rows = await query(
    `SELECT
       b.id,
       b.amount,
       b.status,
       b.created_at,
       u.name AS bidder_name,
       b.user_id = ? AS is_current_user
     FROM bids b
     JOIN users u ON u.id = b.user_id
     WHERE b.auction_item_id = ?
     ORDER BY b.amount DESC, b.created_at ASC;`,
    [req.user.id, auctionItemId],
  )

  res.json({
    data: {
      ...summary,
      bids: rows.map((bid) => ({
        ...bid,
        is_current_user: Boolean(bid.is_current_user),
      })),
    },
  })
}))

router.post('/', asyncRoute(async (req, res) => {
  requireFields(req.body, ['auctionItemId', 'amount'])
  const itemRows = await query(
    'SELECT id, is_active, item_status, main_price, discount_percent FROM auction_items WHERE id = ?;',
    [Number(req.body.auctionItemId)],
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

  const amount = Number(req.body.amount)
  const highBidRows = await query(
    'SELECT COALESCE(MAX(amount), 0) AS currentHighBid FROM bids WHERE auction_item_id = ?;',
    [Number(req.body.auctionItemId)],
  )
  const currentHighBid = Number(highBidRows[0]?.currentHighBid || 0)
  const openingBid = getAuctionPrice(item)
  const minimumNextBid = currentHighBid > 0 ? currentHighBid + minimumBidIncrement : openingBid

  if (!Number.isFinite(amount) || amount < minimumNextBid) {
    res.status(400).json({
      error: `Bid must be at least $${minimumNextBid.toLocaleString('en-US')}.`,
      currentHighBid,
      openingBid,
      minimumNextBid,
    })
    return
  }

  const result = await run(
    'INSERT INTO bids (user_id, auction_item_id, amount, status) VALUES (?, ?, ?, ?);',
    [req.user.id, Number(req.body.auctionItemId), amount, 'pending'],
  )
  const rows = await query('SELECT * FROM bids WHERE id = ?;', [result.insertId])

  res.status(201).json({ data: rows[0] })
}))

module.exports = router
