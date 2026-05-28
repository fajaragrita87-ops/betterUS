export function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

export function nowIso() {
  return new Date().toISOString()
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function requireFields(body, fields) {
  const missing = fields.filter((f) => body?.[f] === undefined || body?.[f] === null || body?.[f] === '')
  return missing
}

