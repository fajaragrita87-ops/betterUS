import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

function secret() {
  return process.env.JWT_SECRET || 'dev_secret_change_me'
}

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '24h' })
}

export function verifyToken(token) {
  return jwt.verify(token, secret())
}

export async function hashPassword(password) {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export function authMiddleware() {
  return (req, res, next) => {
    const header = req.headers.authorization || ''
    const [type, token] = header.split(' ')
    if (type !== 'Bearer' || !token) {
      res.status(401).json({ error: 'UNAUTHORIZED' })
      return
    }

    try {
      const decoded = verifyToken(token)
      req.user = decoded
      next()
    } catch {
      res.status(401).json({ error: 'UNAUTHORIZED' })
    }
  }
}

export function requireRole(...roles) {
  const allowed = new Set(roles)
  return (req, res, next) => {
    const role = req.user?.role
    if (!role || !allowed.has(role)) {
      res.status(403).json({ error: 'FORBIDDEN' })
      return
    }
    next()
  }
}

