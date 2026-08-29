const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { query } = require('../db')
const { toWallet } = require('../utils/mappers')

const router = express.Router()

router.get('/', asyncRoute(async (req, res) => {
  const rows = await query('SELECT * FROM crypto_wallets WHERE is_active = 1 ORDER BY currency_symbol, wallet_name;')
  res.json({ data: rows.map(toWallet) })
}))

module.exports = router
