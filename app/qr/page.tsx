import Link from "next/link"
import { ArrowLeft, QrCode } from "lucide-react"
import { QrLabelTool } from "@/components/qr-label-tool"

export default function QrPage() {
  return (
    <main className="min-h-svh bg-slate-50/60 text-slate-800">
      <header className="border-b border-purple-100 bg-white shadow-2xs">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex size-11 items-center justify-center rounded-xl bg-white p-1 border border-purple-100 shadow-sm overflow-hidden shrink-0">
            <img src="/logo-alaqsyar.png" alt="Logo Al-Aqsyar" className="size-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
              Cetak QR Code &amp; Label Stiker
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Pindai untuk melihat detail aset &middot; Cetak label stiker hemat kertas 4 kolom
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Kembali ke Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <QrLabelTool />
      </section>
    </main>
  )
}
