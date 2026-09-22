import Link from "next/link"
import { ArrowLeft, QrCode } from "lucide-react"
import { QrLabelTool } from "@/components/qr-label-tool"

export default function QrPage() {
  return (
    <main className="min-h-svh bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-5 sm:px-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/25">
            <QrCode className="size-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">QR &amp; Label Cetak</h1>
            <p className="text-sm text-muted-foreground">
              Pindai untuk lihat detail aset &middot; unduh PDF untuk dicetak &amp; ditempel
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <QrLabelTool />
      </section>
    </main>
  )
}
