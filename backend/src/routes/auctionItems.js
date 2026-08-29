const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { query } = require('../db')
const { toAuctionItem } = require('../utils/mappers')

const router = express.Router()

router.get('/', asyncRoute(async (req, res) => {
  const { category, includeInactive } = req.query
  const filters = []
  const params = []

  if (includeInactive !== 'true') {
    filters.push('is_active = ?')
    params.push(1)
  }

  if (category && category !== 'All') {
    filters.push('category = ?')
    params.push(category)
  }

  const where = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''
  const rows = await query(`SELECT * FROM auction_items ${where} ORDER BY created_at DESC, id DESC;`, params)

  res.json({ data: rows.map(toAuctionItem) })
}))

router.get('/:id', asyncRoute(async (req, res) => {
  const rows = await query('SELECT * FROM auction_items WHERE id = ?;', [Number(req.params.id)])

  if (!rows[0]) {
    res.status(404).json({ error: 'Auction item not found.' })
    return
  }

  res.json({ data: toAuctionItem(rows[0]) })
}))

module.exports = router
