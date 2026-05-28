import fs from 'node:fs/promises'
import path from 'node:path'

const dataDir = path.resolve(process.cwd(), 'data')
const dataFile = path.join(dataDir, 'db.json')

async function ensureDataFile() {
  await fs.mkdir(dataDir, { recursive: true })
  try {
    await fs.access(dataFile)
  } catch {
    await fs.writeFile(
      dataFile,
      JSON.stringify({ users: [], donations: [], moments: [] }, null, 2),
      'utf8',
    )
  }
}

export async function readDb() {
  await ensureDataFile()
  const raw = await fs.readFile(dataFile, 'utf8')
  const parsed = JSON.parse(raw)
  return {
    users: Array.isArray(parsed?.users) ? parsed.users : [],
    donations: Array.isArray(parsed?.donations) ? parsed.donations : [],
    moments: Array.isArray(parsed?.moments) ? parsed.moments : [],
  }
}

export async function writeDb(next) {
  await ensureDataFile()
  const safe = {
    users: Array.isArray(next?.users) ? next.users : [],
    donations: Array.isArray(next?.donations) ? next.donations : [],
    moments: Array.isArray(next?.moments) ? next.moments : [],
  }
  await fs.writeFile(dataFile, JSON.stringify(safe, null, 2), 'utf8')
}

