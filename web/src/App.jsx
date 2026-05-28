import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-brand-teal" />
              <div className="leading-tight">
                <div className="text-sm font-semibold text-brand-navy">
                  BetterUs Care
                </div>
                <div className="text-xs text-slate-600">Mobile PWA (prototype)</div>
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
            <Route path="/teman" element={<TemanDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

function Home() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-brand-navy px-5 py-6 text-brand-white">
        <div className="text-sm text-white/80">BetterUs Care</div>
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

function StatusPill({ label }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <div className="font-medium text-slate-900">{label}</div>
      <div className="h-2 w-2 rounded-full bg-brand-gold" />
    </div>
  )
}

function KeluargaDashboard() {
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
        >
          Mulai
        </button>
      </div>
    </div>
  )
}

function TemanDashboard() {
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
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Upload Momen</div>
        <div className="mt-1 text-sm text-slate-600">
          Foto wajib dengan overlay BetterUs Care, geotag, dan watermark.
        </div>
        <button
          type="button"
          className="mt-3 w-full rounded-xl bg-brand-navy px-4 py-3 text-sm font-semibold text-white hover:brightness-110"
        >
          Upload
        </button>
      </div>
    </div>
  )
}

function AdminDashboard() {
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
            <div className="font-semibold text-brand-navy">0</div>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div>Momen menunggu validasi</div>
            <div className="font-semibold text-brand-navy">0</div>
          </div>
        </div>
      </div>
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

export default App
