require('dotenv').config()

const cors = require('cors')
const express = require('express')
const adminRouter = require('./src/routes/admin')
const auctionItemsRouter = require('./src/routes/auctionItems')
const authRouter = require('./src/routes/auth')
const bidsRouter = require('./src/routes/bids')
const paymentsRouter = require('./src/routes/payments')
const usersRouter = require('./src/routes/users')
const walletsRouter = require('./src/routes/wallets')
const { uploadDir } = require('./src/middleware/upload')
const { runMigrations, seedDatabase } = require('./src/db')

const app = express()
const port = Number(process.env.PORT || 4000)
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }

    callback(new Error(`CORS origin not allowed: ${origin}`))
  },
}))
app.use(express.json({ limit: '1mb' }))
app.use('/uploads', express.static(uploadDir))

app.get('/api/health', (req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRouter)
app.use('/api/admin', adminRouter)
app.use('/api/auction-items', auctionItemsRouter)
app.use('/api/bids', bidsRouter)
app.use('/api/crypto-wallets', walletsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/users', usersRouter)

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  res.status(error.status || 500).json({
    error: error.message || 'Unexpected server error.',
  })
})

if (require.main === module) {
  const prepareDatabase = process.env.SEED_ON_START === 'true' ? seedDatabase : runMigrations

  prepareDatabase()
    .then(() => {
      app.listen(port, () => {
        console.log(`Backend listening on http://127.0.0.1:${port}`)
      })
    })
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = app
