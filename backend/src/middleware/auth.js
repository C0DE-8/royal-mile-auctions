const jwt = require('jsonwebtoken')
const { query } = require('../db')

const jwtSecret = process.env.JWT_SECRET || 'dev-only-change-me'

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  )
}

async function authenticate(req, res, next) {
  const header = req.get('authorization') || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) {
    res.status(401).json({ error: 'Authentication required.' })
    return
  }

  try {
    const payload = jwt.verify(token, jwtSecret)
    const users = await query(
      'SELECT id, name, email, role, phone, is_active, created_at, updated_at FROM users WHERE id = ? AND is_active = 1;',
      [payload.id],
    )

    if (!users[0]) {
      res.status(401).json({ error: 'User account is inactive or missing.' })
      return
    }

    req.user = users[0]
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token.' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role === 'admin') {
    next()
    return
  }

  res.status(403).json({ error: 'Admin access required.' })
}

module.exports = {
  authenticate,
  requireAdmin,
  signToken,
}
