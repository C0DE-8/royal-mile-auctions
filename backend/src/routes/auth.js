const bcrypt = require('bcryptjs')
const express = require('express')
const asyncRoute = require('../middleware/asyncRoute')
const { signToken } = require('../middleware/auth')
const { query, run } = require('../db')
const { toUser } = require('../utils/mappers')
const { requireFields } = require('../utils/validation')

const router = express.Router()

router.post('/register', asyncRoute(async (req, res) => {
  requireFields(req.body, ['name', 'email', 'password'])

  const passwordHash = await bcrypt.hash(req.body.password, 10)
  const result = await run(
    'INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?);',
    [req.body.name, req.body.email.toLowerCase(), passwordHash, 'user', req.body.phone || null],
  )
  const users = await query(
    'SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users WHERE id = ?;',
    [result.insertId],
  )
  const user = toUser(users[0])

  res.status(201).json({ data: { user, token: signToken(user) } })
}))

router.post('/login', asyncRoute(async (req, res) => {
  requireFields(req.body, ['email', 'password'])

  const users = await query('SELECT * FROM users WHERE email = ? AND is_active = 1;', [
    req.body.email.toLowerCase(),
  ])
  const user = users[0]

  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password.' })
    return
  }

  const safeUser = toUser(user)
  res.json({ data: { user: safeUser, token: signToken(safeUser) } })
}))

module.exports = router
