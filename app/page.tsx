import Link from "next/link"
import { ShieldCheck, QrCode } from "lucide-react"
import { InventoryDashboard } from "@/components/inventory-dashboard"

export default function Page() {
  return (
    <main className="min-h-svh bg-slate-50/60 text-slate-800">
      {/* Modern Soft Purple Header */}
      <header className="border-b border-purple-100 bg-white shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xs">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Inventaris Aset SMK Al-Aqsyar
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Sistem Manajemen Inventaris IT &amp; Non-IT Terintegrasi QR Code
            </p>
          </div>
          <Link
            href="/qr"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-purple-700 active:bg-purple-800"
          >
            <QrCode className="size-4" aria-hidden />
            Cetak QR &amp; Label
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <InventoryDashboard />
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
          &copy; {new Date().getFullYear()} Sistem Inventaris Aset &middot; Yayasan &amp; SMK Al-Aqsyar
        </div>
      </footer>
    </main>
  )
}
