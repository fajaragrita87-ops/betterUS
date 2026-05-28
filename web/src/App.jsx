import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'

const StoreContext = createContext(null)

const STORAGE_KEY = 'betteruscare_store_v1'

const ZONES = [
  {
    id: 'zn_kotabaru',
    name: 'Kotabaru',
    schedule: 'Minggu ke-1',
    nextDateText: 'Minggu, 1 Juni 2026',
  },
  {
    id: 'zn_sindangkerta',
    name: 'Sindangkerta',
    schedule: 'Minggu ke-2',
    nextDateText: 'Minggu, 8 Juni 2026',
  },
]

const CHILDREN = [
  {
    id: 'ch_hk001',
    code: 'AAR',
    publicName: 'A. A.',
    age: 10,
    zoneId: 'zn_kotabaru',
    status: 'butuh_teman',
  },
  {
    id: 'ch_hk002',
    code: 'SNA',
    publicName: 'S. N.',
    age: 7,
    zoneId: 'zn_kotabaru',
    status: 'aktif',
  },
  {
    id: 'ch_hk003',
    code: 'MRZ',
    publicName: 'M. R.',
    age: 12,
    zoneId: 'zn_sindangkerta',
    status: 'sudah_berkoneksi',
  },
]

const DONATION_STATUSES = [
  'draft',
  'diterima',
  'ditolak',
  'terverifikasi',
  'terjadwal',
  'dalam_perjalanan',
  'di_lokasi',
  'tersalurkan',
  'selesai',
]

function uid(prefix) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`
}

function formatRupiah(amount) {
  const safe = Number.isFinite(Number(amount)) ? Number(amount) : 0
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safe)
}

function nowIso() {
  return new Date().toISOString()
}

function pushHistory(donation, nextStatus) {
  const status = DONATION_STATUSES.includes(nextStatus) ? nextStatus : donation.status
  const history = Array.isArray(donation.history) ? donation.history : []
  return {
    ...donation,
    status,
    history: [...history, { status, at: nowIso() }],
  }
}

function getNextDonationStatus(current) {
  const flow = [
    'diterima',
    'terverifikasi',
    'terjadwal',
    'dalam_perjalanan',
    'di_lokasi',
    'tersalurkan',
    'selesai',
  ]
  const idx = flow.indexOf(current)
  if (idx === -1) return null
  return flow[idx + 1] ?? null
}

function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('StoreContext missing')
  return ctx
}

function loadPersistedStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { donations: [], moments: [] }
    const parsed = JSON.parse(raw)
    const donations = Array.isArray(parsed?.donations) ? parsed.donations : []
    const moments = Array.isArray(parsed?.moments) ? parsed.moments : []
    return { donations, moments }
  } catch {
    return { donations: [], moments: [] }
  }
}

function persistStore({ donations, moments }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ donations, moments }))
  } catch {
  }
}

function App() {
  const initial = useMemo(() => loadPersistedStore(), [])
  const [donations, setDonations] = useState(initial.donations)
  const [moments, setMoments] = useState(initial.moments)

  const store = useMemo(
    () => ({
      donations,
      setDonations,
      moments,
      setMoments,
    }),
    [donations, moments],
  )

  useEffect(() => {
    persistStore({ donations, moments })
  }, [donations, moments])

  return (
    <BrowserRouter>
      <StoreContext.Provider value={store}>
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
              <Link to="/" className="flex items-center gap-2">
                <AppLogo />
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-brand-navy">
                    BetterUs Care
                  </div>
                  <div className="text-xs text-slate-600">
                    Mobile PWA (prototype)
                  </div>
                </div>
              </Link>
              <nav className="flex items-center gap-3 text-sm">
                <Link className="text-slate-600 hover:text-slate-900" to="/keluarga">
                  Keluarga
                </Link>
                <Link className="text-slate-600 hover:text-slate-900" to="/teman">
                  Teman
                </Link>
                <Link className="text-slate-600 hover:text-slate-900" to="/admin">
                  Admin
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto max-w-md px-4 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/keluarga" element={<KeluargaDashboard />} />
              <Route path="/keluarga/kebaikan" element={<KeluargaKebaikan />} />
              <Route path="/keluarga/bukti/:donationId" element={<KeluargaBukti />} />
              <Route
                path="/keluarga/tracking/:donationId"
                element={<KeluargaTracking />}
              />
              <Route path="/teman" element={<TemanDashboard />} />
              <Route path="/teman/tugas" element={<TemanTugas />} />
              <Route path="/teman/upload/:donationId" element={<TemanUpload />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/verifikasi" element={<AdminVerifikasi />} />
              <Route path="/admin/momen" element={<AdminMomen />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </StoreContext.Provider>
    </BrowserRouter>
  )
}

function Home() {
  const { setDonations, setMoments } = useStore()

  function clearDemoData() {
    setDonations([])
    setMoments([])
  }

  function seedDemoData() {
    const id = uid('dn')
    const donation = {
      id,
      amount: 25000,
      type: 'hybrid',
      poolAmount: 15000,
      personalAmount: 10000,
      targetChildId: 'ch_hk001',
      status: 'diterima',
      history: [
        { status: 'draft', at: nowIso() },
        { status: 'diterima', at: nowIso() },
      ],
      createdAt: nowIso(),
      bankName: 'BCA',
      senderName: 'Demo Keluarga',
      transferDate: new Date().toISOString().slice(0, 10),
      proofFileName: 'bukti-demo.png',
    }
    setDonations((prev) => [...prev, donation])
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-navy px-5 py-6 text-brand-white">
        <div className="flex items-center gap-2 text-sm text-white/80">
          <div className="h-8 w-8 rounded-xl bg-white/10 p-1">
            <img
              src="/logo.png"
              alt="BetterUs Care"
              className="h-full w-full rounded-lg object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
          <div>BetterUs Care</div>
        </div>
        <h1 className="mt-2 text-2xl font-semibold leading-snug">
          Menghubungkan kebaikan dengan harapan kecil melalui pooling dan koneksi
          personal.
        </h1>
        <p className="mt-3 text-sm text-white/85">
          Prototype UI ini mengikuti SRS v1.0 (28 Mei 2026) sebagai baseline.
        </p>
      </section>

      <section className="grid gap-3">
        <RoleCard
          title="Keluarga (Donatur)"
          desc="Zona • Berikan kebaikan • Tracking perjalanan • Momen doa"
          to="/keluarga"
        />
        <RoleCard
          title="Teman (Agent Lapangan)"
          desc="Jadwal zona • Upload momen (foto/geotag/timestamp) • Selesaikan perjalanan"
          to="/teman"
        />
        <RoleCard
          title="Admin"
          desc="Verifikasi kebaikan • Validasi momen • Kelola zona & harapan kecil"
          to="/admin"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">
          Status Perjalanan (SRS)
        </div>
        <div className="mt-3 grid gap-2 text-sm text-slate-700">
          <StatusPill label="diterima" />
          <StatusPill label="terverifikasi" />
          <StatusPill label="terjadwal" />
          <StatusPill label="dalam_perjalanan" />
          <StatusPill label="di_lokasi" />
          <StatusPill label="tersalurkan" />
          <StatusPill label="selesai" />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Demo Tools</div>
        <div className="mt-2 text-sm text-slate-600">
          Data prototype disimpan di browser (localStorage) supaya tidak hilang saat
          refresh.
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={seedDemoData}
            className="rounded-xl bg-brand-teal px-3 py-3 text-sm font-semibold text-white hover:brightness-95"
          >
            Seed Data
          </button>
          <button
            type="button"
            onClick={clearDemoData}
            className="rounded-xl bg-slate-900 px-3 py-3 text-sm font-semibold text-white hover:brightness-110"
          >
            Reset
          </button>
        </div>
      </section>
    </div>
  )
}

function RoleCard({ title, desc, to }) {
  return (
    <Link
      to={to}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
    >
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-slate-900">{title}</div>
        <div className="text-sm text-brand-teal">Buka</div>
      </div>
      <div className="mt-2 text-sm text-slate-600">{desc}</div>
    </Link>
  )
}

function AppLogo() {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <div className="h-9 w-9 rounded-xl bg-brand-teal" />
  }

  return (
    <div className="h-9 w-9 rounded-xl bg-white p-1 ring-1 ring-slate-200">
      <img
        src="/logo.png"
        alt="BetterUs Care"
        className="h-full w-full rounded-lg object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

function StatusPill({ label }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <div className="font-medium text-slate-900">{label}</div>
      <div className="h-2 w-2 rounded-full bg-brand-gold" />
    </div>
  )
}

function KeluargaDashboard() {
  const navigate = useNavigate()
  const { donations } = useStore()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard Keluarga"
        subtitle="Zona auto-detect • Pool (Bersama Semua) • Koneksi Personal"
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Zona</div>
        <div className="mt-1 text-sm text-slate-600">
          Prototype: zona akan dideteksi via GPS atau dipilih manual.
        </div>
        <div className="mt-3 grid gap-2">
          {ZONES.map((z) => (
            <div
              key={z.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
            >
              <div className="font-medium text-slate-900">{z.name}</div>
              <div className="text-slate-600">{z.nextDateText}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">
          Berikan Kebaikan
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Min Rp 10.000 • Pilihan: 100% Pool / Split / Personal.
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:brightness-95"
          onClick={() => navigate('/keluarga/kebaikan')}
        >
          Mulai
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Riwayat</div>
          <div className="text-xs text-slate-500">{donations.length} item</div>
        </div>
        <div className="mt-3 grid gap-2">
          {donations.length === 0 ? (
            <div className="text-sm text-slate-600">
              Belum ada kebaikan yang dibuat.
            </div>
          ) : (
            donations
              .slice()
              .reverse()
              .map((d) => (
                <Link
                  key={d.id}
                  to={`/keluarga/tracking/${d.id}`}
                  className="rounded-xl bg-slate-50 px-3 py-3 text-sm transition hover:bg-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">
                      {formatRupiah(d.amount)}
                    </div>
                    <div className="text-xs text-slate-600">{d.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Pool: {formatRupiah(d.poolAmount)} • Personal:{' '}
                    {formatRupiah(d.personalAmount)}
                  </div>
                </Link>
              ))
          )}
        </div>
      </div>
    </div>
  )
}

function KeluargaKebaikan() {
  const navigate = useNavigate()
  const { setDonations } = useStore()
  const [amount, setAmount] = useState(10000)
  const [type, setType] = useState('pool_only')
  const [poolAmount, setPoolAmount] = useState(10000)
  const [personalAmount, setPersonalAmount] = useState(0)
  const [targetChildId, setTargetChildId] = useState('')

  const childOptions = useMemo(() => {
    const order = { butuh_teman: 0, aktif: 1, sudah_berkoneksi: 2, nonaktif: 3 }
    return CHILDREN.slice().sort((a, b) => {
      const oa = order[a.status] ?? 99
      const ob = order[b.status] ?? 99
      if (oa !== ob) return oa - ob
      return a.age - b.age
    })
  }, [])

  const effectivePool = Math.max(0, Number(poolAmount) || 0)
  const effectivePersonal = Math.max(0, Number(personalAmount) || 0)
  const total = Math.max(0, Number(amount) || 0)
  const isHybrid = type === 'hybrid'
  const needsChild = (type === 'personal_only' || type === 'hybrid') && effectivePersonal > 0
  const isValid =
    total >= 10000 &&
    (type === 'pool_only' ? effectivePersonal === 0 : true) &&
    (type === 'personal_only' ? effectivePool === 0 : true) &&
    (!isHybrid || effectivePool + effectivePersonal === total) &&
    (!needsChild || Boolean(targetChildId))

  function applyType(next) {
    setType(next)
    if (next === 'pool_only') {
      setPoolAmount(total)
      setPersonalAmount(0)
      setTargetChildId('')
    }
    if (next === 'personal_only') {
      setPoolAmount(0)
      setPersonalAmount(total)
    }
    if (next === 'hybrid') {
      const half = Math.floor(total / 2)
      setPoolAmount(half)
      setPersonalAmount(total - half)
    }
  }

  function onAmountChange(next) {
    const value = Math.max(0, Number(next) || 0)
    setAmount(value)
    if (type === 'pool_only') {
      setPoolAmount(value)
      setPersonalAmount(0)
    } else if (type === 'personal_only') {
      setPoolAmount(0)
      setPersonalAmount(value)
    } else {
      const currentPool = Math.max(0, Number(poolAmount) || 0)
      const currentPersonal = Math.max(0, Number(personalAmount) || 0)
      const sum = currentPool + currentPersonal
      if (sum === 0) {
        const half = Math.floor(value / 2)
        setPoolAmount(half)
        setPersonalAmount(value - half)
      } else {
        const poolRatio = currentPool / sum
        const nextPool = Math.round(value * poolRatio)
        setPoolAmount(nextPool)
        setPersonalAmount(value - nextPool)
      }
    }
  }

  function createDonation() {
    if (!isValid) return
    const id = uid('dn')
    const donation = {
      id,
      amount: total,
      type,
      poolAmount: type === 'pool_only' ? total : effectivePool,
      personalAmount: type === 'personal_only' ? total : effectivePersonal,
      targetChildId: needsChild ? targetChildId : null,
      status: 'draft',
      history: [{ status: 'draft', at: nowIso() }],
      createdAt: nowIso(),
    }
    setDonations((prev) => [...prev, donation])
    navigate(`/keluarga/bukti/${id}`)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Buat Kebaikan"
        subtitle="Input nominal • Pilih pembagian • Pilih harapan kecil (jika personal)"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Nominal</div>
        <div className="mt-2 flex items-center gap-3">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            inputMode="numeric"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
          />
          <div className="text-sm font-semibold text-slate-900">
            {formatRupiah(total)}
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500">Minimal Rp 10.000</div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Pembagian</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <button
            type="button"
            onClick={() => applyType('pool_only')}
            className={`rounded-xl border px-3 py-2 text-sm ${
              type === 'pool_only'
                ? 'border-brand-teal bg-brand-teal text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            Pool
          </button>
          <button
            type="button"
            onClick={() => applyType('hybrid')}
            className={`rounded-xl border px-3 py-2 text-sm ${
              type === 'hybrid'
                ? 'border-brand-teal bg-brand-teal text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => applyType('personal_only')}
            className={`rounded-xl border px-3 py-2 text-sm ${
              type === 'personal_only'
                ? 'border-brand-teal bg-brand-teal text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            }`}
          >
            Personal
          </button>
        </div>

        <div className="mt-3 grid gap-2 text-sm text-slate-700">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Pool (Bersama Semua)</div>
            <div className="font-semibold text-slate-900">
              {formatRupiah(type === 'pool_only' ? total : effectivePool)}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Personal</div>
            <div className="font-semibold text-slate-900">
              {formatRupiah(type === 'personal_only' ? total : effectivePersonal)}
            </div>
          </div>
        </div>

        {isHybrid ? (
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs font-semibold text-slate-700">Pool</div>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
                  inputMode="numeric"
                  value={poolAmount}
                  onChange={(e) => setPoolAmount(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-700">Personal</div>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
                  inputMode="numeric"
                  value={personalAmount}
                  onChange={(e) => setPersonalAmount(e.target.value)}
                />
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Total harus sama dengan nominal: {formatRupiah(total)}
            </div>
          </div>
        ) : null}
      </div>

      {needsChild ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-sm font-semibold text-slate-900">
            Pilih Harapan Kecil
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Prioritas ditampilkan: butuh_teman lebih dulu.
          </div>
          <div className="mt-3 grid gap-2">
            {childOptions.map((c) => {
              const z = ZONES.find((x) => x.id === c.zoneId)
              const active = targetChildId === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setTargetChildId(c.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left text-sm ${
                    active
                      ? 'border-brand-teal bg-brand-teal/10'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-slate-900">
                      {c.code} • {c.publicName}
                    </div>
                    <div className="text-xs text-slate-600">{c.status}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Umur {c.age} • Zona {z?.name ?? '-'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={createDonation}
        disabled={!isValid}
        className={`w-full rounded-xl px-4 py-3 text-sm font-semibold ${
          isValid
            ? 'bg-brand-navy text-white hover:brightness-110'
            : 'bg-slate-200 text-slate-500'
        }`}
      >
        Lanjut Upload Bukti
      </button>
    </div>
  )
}

function KeluargaBukti() {
  const navigate = useNavigate()
  const { donationId } = useParams()
  const { donations, setDonations } = useStore()
  const donation = donations.find((d) => d.id === donationId)
  const [bankName, setBankName] = useState('')
  const [senderName, setSenderName] = useState('')
  const [transferDate, setTransferDate] = useState('')
  const [fileName, setFileName] = useState('')

  if (!donation) return <NotFound />

  function submitProof() {
    if (!bankName || !senderName || !transferDate || !fileName) return
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donation.id) return d
        const updated = {
          ...d,
          bankName,
          senderName,
          transferDate,
          proofFileName: fileName,
        }
        return pushHistory(updated, 'diterima')
      }),
    )
    navigate(`/keluarga/tracking/${donation.id}`)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Upload Bukti Transfer"
        subtitle="Bank pengirim • Nama pengirim • Tanggal transfer • Foto/screenshot"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Ringkasan</div>
        <div className="mt-2 grid gap-2 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Nominal</div>
            <div className="font-semibold text-slate-900">
              {formatRupiah(donation.amount)}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Pool</div>
            <div className="font-semibold text-slate-900">
              {formatRupiah(donation.poolAmount)}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Personal</div>
            <div className="font-semibold text-slate-900">
              {formatRupiah(donation.personalAmount)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Form Bukti</div>
        <div className="mt-3 grid gap-2">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            placeholder="Bank pengirim"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            placeholder="Nama pengirim"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            type="date"
            value={transferDate}
            onChange={(e) => setTransferDate(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            type="file"
            accept="image/*"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
          />
          <div className="text-xs text-slate-500">{fileName || 'Belum ada file'}</div>
        </div>

        <button
          type="button"
          onClick={submitProof}
          disabled={!bankName || !senderName || !transferDate || !fileName}
          className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold ${
            bankName && senderName && transferDate && fileName
              ? 'bg-brand-teal text-white hover:brightness-95'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          Kirim Bukti
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">
          Video Sambutan Global
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Setelah upload bukti, keluarga akan melihat video ucapan terima kasih
          (kolektif).
        </div>
        <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
          Placeholder konten video (library konten).
        </div>
      </div>
    </div>
  )
}

function KeluargaTracking() {
  const { donationId } = useParams()
  const { donations } = useStore()
  const donation = donations.find((d) => d.id === donationId)

  if (!donation) return <NotFound />

  const child = donation.targetChildId
    ? CHILDREN.find((c) => c.id === donation.targetChildId)
    : null
  const zone = child ? ZONES.find((z) => z.id === child.zoneId) : null
  const history = Array.isArray(donation.history) ? donation.history : []

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tracking Perjalanan"
        subtitle="Timeline status + timestamp (prototype)"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">
            {formatRupiah(donation.amount)}
          </div>
          <div className="text-xs text-slate-600">{donation.status}</div>
        </div>
        <div className="mt-2 text-xs text-slate-600">
          Pool: {formatRupiah(donation.poolAmount)} • Personal:{' '}
          {formatRupiah(donation.personalAmount)}
        </div>
        {child ? (
          <div className="mt-2 text-xs text-slate-600">
            Personal ke {child.code} ({child.publicName}) • Zona {zone?.name ?? '-'}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Timeline</div>
        <div className="mt-3 grid gap-2 text-sm">
          {history.length === 0 ? (
            <div className="text-sm text-slate-600">Belum ada status.</div>
          ) : (
            history
              .slice()
              .reverse()
              .map((h, idx) => (
                <div
                  key={`${h.status}_${h.at}_${idx}`}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                >
                  <div className="font-medium text-slate-900">{h.status}</div>
                  <div className="text-xs text-slate-600">
                    {new Date(h.at).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Catatan</div>
        <div className="mt-2 text-sm text-slate-600">
          Perubahan status dilakukan oleh Admin/Teman. Untuk demo, gunakan halaman
          Admin Verifikasi dan Teman Tugas.
        </div>
        <div className="mt-3 grid gap-2">
          <Link
            to="/admin/verifikasi"
            className="w-full rounded-xl bg-brand-navy px-4 py-3 text-center text-sm font-semibold text-white hover:brightness-110"
          >
            Buka Admin Verifikasi
          </Link>
          <Link
            to="/teman/tugas"
            className="w-full rounded-xl bg-brand-teal px-4 py-3 text-center text-sm font-semibold text-white hover:brightness-95"
          >
            Buka Teman Tugas
          </Link>
        </div>
      </div>
    </div>
  )
}

function TemanDashboard() {
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard Teman"
        subtitle="Jadwal zona • Upload momen (foto/video/voice note) • Geotag + timestamp"
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">
          Jadwal Kunjungan
        </div>
        <div className="mt-1 text-sm text-slate-600">
          Prototype: list jadwal per zona + daftar harapan kecil.
        </div>
        <button
          type="button"
          onClick={() => navigate('/teman/tugas')}
          className="mt-3 w-full rounded-xl bg-brand-teal px-4 py-3 text-sm font-semibold text-white hover:brightness-95"
        >
          Lihat Tugas
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Upload Momen</div>
        <div className="mt-1 text-sm text-slate-600">
          Foto wajib dengan overlay BetterUs Care, geotag, dan watermark.
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
          onClick={() => navigate('/teman/tugas')}
        >
          Upload
        </button>
      </div>
    </div>
  )
}

function TemanTugas() {
  const { donations, setDonations } = useStore()

  const actionable = donations
    .filter((d) =>
      ['terverifikasi', 'terjadwal', 'dalam_perjalanan', 'di_lokasi'].includes(d.status),
    )
    .slice()
    .reverse()

  function setStatus(donationId, nextStatus) {
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d
        return pushHistory(d, nextStatus)
      }),
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tugas Teman"
        subtitle="Simulasi perjalanan + upload momen (prototype)"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">
          Perjalanan Aktif
        </div>
        <div className="mt-3 grid gap-2">
          {actionable.length === 0 ? (
            <div className="text-sm text-slate-600">
              Belum ada perjalanan yang bisa diproses.
            </div>
          ) : (
            actionable.map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-slate-200 bg-white px-3 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">
                    {formatRupiah(d.amount)}
                  </div>
                  <div className="text-xs text-slate-600">{d.status}</div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                    onClick={() =>
                      setStatus(
                        d.id,
                        d.status === 'terverifikasi' ? 'terjadwal' : 'dalam_perjalanan',
                      )
                    }
                  >
                    {d.status === 'terverifikasi' ? 'Jadwalkan' : 'Mulai'}
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200"
                    onClick={() => setStatus(d.id, 'di_lokasi')}
                  >
                    Di Lokasi
                  </button>
                </div>
                <Link
                  to={`/teman/upload/${d.id}`}
                  className="mt-2 block w-full rounded-xl bg-brand-navy px-3 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
                >
                  Upload Momen
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TemanUpload() {
  const navigate = useNavigate()
  const { donationId } = useParams()
  const { donations, setDonations, setMoments } = useStore()
  const donation = donations.find((d) => d.id === donationId)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [photoName, setPhotoName] = useState('')
  const [videoName, setVideoName] = useState('')
  const [voiceName, setVoiceName] = useState('')

  if (!donation) return <NotFound />

  function submitMoment() {
    if (!photoName) return

    const moment = {
      id: uid('mm'),
      donationId: donation.id,
      status: 'menunggu',
      createdAt: nowIso(),
      geotagLat: lat ? Number(lat) : null,
      geotagLng: lng ? Number(lng) : null,
      photoName,
      videoName: videoName || null,
      voiceName: voiceName || null,
    }

    setMoments((prev) => [...prev, moment])
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donation.id) return d
        return pushHistory(d, 'tersalurkan')
      }),
    )
    navigate('/admin/momen')
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Upload Momen"
        subtitle="Foto wajib + geotag + timestamp (prototype)"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Perjalanan</div>
        <div className="mt-2 text-sm text-slate-700">
          {formatRupiah(donation.amount)} • Status: {donation.status}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Geotag</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            placeholder="Lat"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            placeholder="Lng"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Timestamp otomatis saat submit.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">File</div>
        <div className="mt-3 grid gap-2">
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            type="file"
            accept="image/*"
            onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? '')}
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            type="file"
            accept="video/*"
            onChange={(e) => setVideoName(e.target.files?.[0]?.name ?? '')}
          />
          <input
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-300"
            type="file"
            accept="audio/*"
            onChange={(e) => setVoiceName(e.target.files?.[0]?.name ?? '')}
          />
          <div className="text-xs text-slate-500">
            Foto wajib. Video/voice opsional.
          </div>
        </div>

        <button
          type="button"
          onClick={submitMoment}
          disabled={!photoName}
          className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold ${
            photoName
              ? 'bg-brand-teal text-white hover:brightness-95'
              : 'bg-slate-200 text-slate-500'
          }`}
        >
          Kirim Momen (ke Admin)
        </button>
      </div>
    </div>
  )
}

function AdminDashboard() {
  const navigate = useNavigate()
  const { donations, moments } = useStore()
  const pendingVerify = donations.filter((d) => d.status === 'diterima').length
  const pendingMoments = moments.filter((m) => m.status === 'menunggu').length

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard Admin"
        subtitle="Verifikasi kebaikan • Validasi momen • Kelola zona & harapan kecil"
      />
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">
          Perlu Perhatian
        </div>
        <div className="mt-3 grid gap-2 text-sm text-slate-700">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Kebaikan menunggu verifikasi</div>
            <div className="font-semibold text-brand-navy">{pendingVerify}</div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Momen menunggu validasi</div>
            <div className="font-semibold text-brand-navy">{pendingMoments}</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => navigate('/admin/verifikasi')}
            className="rounded-xl bg-brand-navy px-3 py-3 text-sm font-semibold text-white hover:brightness-110"
          >
            Verifikasi
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/momen')}
            className="rounded-xl bg-brand-teal px-3 py-3 text-sm font-semibold text-white hover:brightness-95"
          >
            Validasi Momen
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminVerifikasi() {
  const { donations, setDonations } = useStore()
  const pending = donations
    .filter((d) => d.status === 'diterima')
    .slice()
    .reverse()

  function verifyDonation(donationId) {
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d
        return pushHistory(d, 'terverifikasi')
      }),
    )
  }

  function rejectDonation(donationId, reason) {
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d
        const updated = { ...d, rejectionReason: reason || 'Ditolak' }
        return pushHistory(updated, 'ditolak')
      }),
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin • Verifikasi Kebaikan"
        subtitle="Approve / Reject bukti transfer (prototype)"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">
          Menunggu Verifikasi
        </div>
        <div className="mt-3 grid gap-2">
          {pending.length === 0 ? (
            <div className="text-sm text-slate-600">Tidak ada antrian.</div>
          ) : (
            pending.map((d) => (
              <AdminDonationCard
                key={d.id}
                donation={d}
                onVerify={() => verifyDonation(d.id)}
                onReject={(reason) => rejectDonation(d.id, reason)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AdminDonationCard({ donation, onVerify, onReject }) {
  const [reason, setReason] = useState('')
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">
          {formatRupiah(donation.amount)}
        </div>
        <div className="text-xs text-slate-600">{donation.status}</div>
      </div>
      <div className="mt-2 text-xs text-slate-600">
        Bank: {donation.bankName || '-'} • Pengirim: {donation.senderName || '-'}
      </div>
      <div className="mt-1 text-xs text-slate-600">
        Tanggal: {donation.transferDate || '-'} • File: {donation.proofFileName || '-'}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onVerify}
          className="rounded-xl bg-brand-teal px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(reason)}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Reject
        </button>
      </div>
      <input
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
        placeholder="Alasan reject (opsional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </div>
  )
}

function AdminMomen() {
  const { moments, setMoments, setDonations } = useStore()
  const pending = moments.filter((m) => m.status === 'menunggu').slice().reverse()

  function approveMoment(momentId) {
    setMoments((prev) =>
      prev.map((m) => (m.id === momentId ? { ...m, status: 'divalidasi' } : m)),
    )
    setDonations((prev) =>
      prev.map((d) => {
        const owns = moments.find((m) => m.id === momentId)?.donationId === d.id
        if (!owns) return d
        if (d.status !== 'tersalurkan') return d
        return pushHistory(d, 'selesai')
      }),
    )
  }

  function rejectMoment(momentId, reason) {
    setMoments((prev) =>
      prev.map((m) =>
        m.id === momentId
          ? { ...m, status: 'ditolak', rejectionReason: reason || 'Ditolak' }
          : m,
      ),
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Admin • Validasi Momen"
        subtitle="Approve / Reject momen dari Teman (prototype)"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Menunggu</div>
        <div className="mt-3 grid gap-2">
          {pending.length === 0 ? (
            <div className="text-sm text-slate-600">Tidak ada antrian.</div>
          ) : (
            pending.map((m) => (
              <AdminMomentCard
                key={m.id}
                moment={m}
                onApprove={() => approveMoment(m.id)}
                onReject={(reason) => rejectMoment(m.id, reason)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function AdminMomentCard({ moment, onApprove, onReject }) {
  const [reason, setReason] = useState('')
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Momen</div>
        <div className="text-xs text-slate-600">{moment.status}</div>
      </div>
      <div className="mt-2 text-xs text-slate-600">
        Foto: {moment.photoName || '-'}
      </div>
      <div className="mt-1 text-xs text-slate-600">
        Video: {moment.videoName || '-'} • Voice: {moment.voiceName || '-'}
      </div>
      <div className="mt-1 text-xs text-slate-600">
        Geotag: {moment.geotagLat ?? '-'}, {moment.geotagLng ?? '-'}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onApprove}
          className="rounded-xl bg-brand-teal px-3 py-2 text-sm font-semibold text-white hover:brightness-95"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={() => onReject(reason)}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:brightness-110"
        >
          Reject
        </button>
      </div>
      <input
        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
        placeholder="Alasan reject (opsional)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
    </div>
  )
}

function PageHeader({ title, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="text-lg font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  )
}

function NotFound() {
  return (
    <div className="space-y-4">
      <PageHeader title="Halaman tidak ditemukan" subtitle="404" />
      <Link
        to="/"
        className="block w-full rounded-xl bg-brand-navy px-4 py-3 text-center text-sm font-semibold text-white hover:brightness-110"
      >
        Kembali ke Home
      </Link>
    </div>
  )
}

export default App
