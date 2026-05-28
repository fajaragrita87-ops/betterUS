import cors from 'cors'
import express from 'express'
import { authMiddleware, hashPassword, requireRole, signToken, verifyPassword } from './auth.js'
import { readDb, writeDb } from './storage.js'
import { nowIso, normalizeEmail, requireFields, uid } from './utils.js'

const app = express()

app.use(express.json({ limit: '2mb' }))

const rate = new Map()

function getIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  return xf || req.socket.remoteAddress || 'unknown'
}

function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const ip = getIp(req)
    const now = Date.now()
    const entry = rate.get(ip) || { ts: now, count: 0 }
    const fresh = now - entry.ts > windowMs
    const nextEntry = fresh ? { ts: now, count: 1 } : { ts: entry.ts, count: entry.count + 1 }
    rate.set(ip, nextEntry)
    if (nextEntry.count > max) {
      res.status(429).json({ error: 'RATE_LIMITED' })
      return
    }
    next()
  }
}

app.use('/api', rateLimit({ windowMs: 60_000, max: 100 }))
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: nowIso() })
})

app.post('/api/auth/register', async (req, res) => {
  const missing = requireFields(req.body, ['name', 'email', 'phone', 'password', 'role'])
  if (missing.length) {
    res.status(400).json({ error: 'VALIDATION_ERROR', missing })
    return
  }

  const role = req.body.role
  if (!['keluarga', 'teman', 'admin'].includes(role)) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid role' })
    return
  }

  const email = normalizeEmail(req.body.email)
  const db = await readDb()
  const exists = db.users.some((u) => normalizeEmail(u.email) === email)
  if (exists) {
    res.status(409).json({ error: 'EMAIL_ALREADY_USED' })
    return
  }

  const passwordHash = await hashPassword(String(req.body.password))
  const user = {
    id: uid('usr'),
    email,
    passwordHash,
    name: String(req.body.name),
    phone: String(req.body.phone),
    role,
    zoneId: req.body.zoneId ? String(req.body.zoneId) : null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    isActive: true,
  }

  db.users.push(user)
  await writeDb(db)

  const token = signToken({ sub: user.id, role: user.role })
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
  })
})

app.post('/api/auth/login', rateLimit({ windowMs: 5 * 60_000, max: 10 }), async (req, res) => {
  const missing = requireFields(req.body, ['email', 'password'])
  if (missing.length) {
    res.status(400).json({ error: 'VALIDATION_ERROR', missing })
    return
  }

  const email = normalizeEmail(req.body.email)
  const db = await readDb()
  const user = db.users.find((u) => normalizeEmail(u.email) === email)
  if (!user || !user.isActive) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    return
  }

  const ok = await verifyPassword(String(req.body.password), user.passwordHash)
  if (!ok) {
    res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    return
  }

  const token = signToken({ sub: user.id, role: user.role })
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role },
  })
})

app.get('/api/me', authMiddleware(), async (req, res) => {
  const db = await readDb()
  const user = db.users.find((u) => u.id === req.user.sub)
  if (!user) {
    res.status(401).json({ error: 'UNAUTHORIZED' })
    return
  }
  res.json({ id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role })
})

app.post('/api/donations', authMiddleware(), requireRole('keluarga'), async (req, res) => {
  const missing = requireFields(req.body, ['amount', 'type', 'poolAmount', 'personalAmount'])
  if (missing.length) {
    res.status(400).json({ error: 'VALIDATION_ERROR', missing })
    return
  }

  const amount = Number(req.body.amount)
  if (!Number.isFinite(amount) || amount < 10000) {
    res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Min amount is 10000' })
    return
  }

  const donation = {
    id: uid('dn'),
    userId: req.user.sub,
    amount,
    type: String(req.body.type),
    poolAmount: Number(req.body.poolAmount) || 0,
    personalAmount: Number(req.body.personalAmount) || 0,
    targetChildId: req.body.targetChildId ? String(req.body.targetChildId) : null,
    status: 'draft',
    history: [{ status: 'draft', at: nowIso() }],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }

  const db = await readDb()
  db.donations.push(donation)
  await writeDb(db)
  res.json(donation)
})

app.post('/api/donations/:id/proof', authMiddleware(), requireRole('keluarga'), async (req, res) => {
  const missing = requireFields(req.body, ['bankName', 'senderName', 'transferDate', 'proofFileName'])
  if (missing.length) {
    res.status(400).json({ error: 'VALIDATION_ERROR', missing })
    return
  }

  const db = await readDb()
  const donation = db.donations.find((d) => d.id === req.params.id)
  if (!donation || donation.userId !== req.user.sub) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  donation.bankName = String(req.body.bankName)
  donation.senderName = String(req.body.senderName)
  donation.transferDate = String(req.body.transferDate)
  donation.proofFileName = String(req.body.proofFileName)
  donation.status = 'diterima'
  donation.history = [...(donation.history || []), { status: 'diterima', at: nowIso() }]
  donation.updatedAt = nowIso()

  await writeDb(db)
  res.json(donation)
})

app.get('/api/donations/my', authMiddleware(), requireRole('keluarga'), async (req, res) => {
  const db = await readDb()
  const list = db.donations
    .filter((d) => d.userId === req.user.sub)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  res.json(list)
})

app.get('/api/donations/:id/track', authMiddleware(), async (req, res) => {
  const db = await readDb()
  const donation = db.donations.find((d) => d.id === req.params.id)
  if (!donation) {
    res.status(404).json({ error: 'NOT_FOUND' })
    return
  }

  const isOwner = donation.userId === req.user.sub
  const isAdminOrTeman = ['admin', 'teman'].includes(req.user.role)
  if (!isOwner && !isAdminOrTeman) {
    res.status(403).json({ error: 'FORBIDDEN' })
    return
  }

  res.json({ id: donation.id, status: donation.status, history: donation.history || [] })
})

app.get('/api/admin/donations/pending', authMiddleware(), requireRole('admin'), async (_req, res) => {
  const db = await readDb()
  const list = db.donations
    .filter((d) => d.status === 'diterima')
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
  res.json(list)
})

app.post(
  '/api/admin/donations/:id/verify',
  authMiddleware(),
  requireRole('admin'),
  async (req, res) => {
    const missing = requireFields(req.body, ['action'])
    if (missing.length) {
      res.status(400).json({ error: 'VALIDATION_ERROR', missing })
      return
    }

    const action = String(req.body.action)
    if (!['approve', 'reject'].includes(action)) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid action' })
      return
    }

    const db = await readDb()
    const donation = db.donations.find((d) => d.id === req.params.id)
    if (!donation) {
      res.status(404).json({ error: 'NOT_FOUND' })
      return
    }

    if (action === 'approve') {
      donation.status = 'terverifikasi'
      donation.history = [...(donation.history || []), { status: 'terverifikasi', at: nowIso() }]
    } else {
      donation.status = 'ditolak'
      donation.rejectionReason = req.body.reason ? String(req.body.reason) : 'Ditolak'
      donation.history = [...(donation.history || []), { status: 'ditolak', at: nowIso() }]
    }
    donation.updatedAt = nowIso()

    await writeDb(db)
    res.json(donation)
  },
)

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  process.stdout.write(`API listening on http://localhost:${port}\n`)
})
