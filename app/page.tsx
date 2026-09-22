import Link from "next/link"
import { HardDrive, QrCode } from "lucide-react"
import { InventoryDashboard } from "@/components/inventory-dashboard"

export default function Page() {
  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25">
            <HardDrive className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              Inventaris Komputer Al-Aqsyar
            </h1>
            <p className="text-sm text-muted-foreground">
              Data unit PC per jurusan &middot; TJKT, MPLB, DKV, AKL, PM, SMP
            </p>
          </div>
          <Link
            href="/qr"
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-sky-400"
          >
            <QrCode className="size-4" aria-hidden />
            QR &amp; Label
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <InventoryDashboard />
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          Sistem Inventaris Komputer &middot; SMK Al-Aqsyar
        </div>
      </footer>
    </main>
  )
}
