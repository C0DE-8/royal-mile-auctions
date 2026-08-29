const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { query } = require('../db')
const { toAuctionItem } = require('../utils/mappers')

const router = express.Router()

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

  const where = filters.length > 0 ? `WHERE ${filters.map((filter) => `ai.${filter}`).join(' AND ')}` : ''
  const rows = await query(`
    ${auctionItemSelect}
    ${where}
    ORDER BY ai.created_at DESC, ai.id DESC;
  `, params)

  res.json({ data: rows.map(toAuctionItem) })
}))

router.get('/:id', asyncRoute(async (req, res) => {
  const rows = await query(`
    ${auctionItemSelect}
    WHERE ai.id = ?
  `, [Number(req.params.id)])

  if (!rows[0]) {
    res.status(404).json({ error: 'Auction item not found.' })
    return
  }

  res.json({ data: toAuctionItem(rows[0]) })
}))

module.exports = router
