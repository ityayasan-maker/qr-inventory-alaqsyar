import { Monitor, CheckCircle2, AlertTriangle, XCircle, MousePointerClick } from "lucide-react"

type Props = {
  total: number
  baik: number
  bermasalah: number
  mati: number
  selectedKondisi?: string
  onSelectKondisi?: (kondisi: string) => void
}

const cards = [
  { key: "total", kondisiKey: "all", label: "Total Unit Aset", icon: Monitor, tone: "text-purple-600", bg: "bg-purple-50", ring: "border-purple-200", activeBg: "ring-2 ring-purple-600 shadow-md bg-purple-50/30" },
  { key: "baik", kondisiKey: "baik", label: "Kondisi Baik", icon: CheckCircle2, tone: "text-emerald-600", bg: "bg-emerald-50", ring: "border-emerald-200", activeBg: "ring-2 ring-emerald-600 shadow-md bg-emerald-50/30" },
  { key: "bermasalah", kondisiKey: "bermasalah", label: "Rusak Ringan", icon: AlertTriangle, tone: "text-amber-600", bg: "bg-amber-50", ring: "border-amber-200", activeBg: "ring-2 ring-amber-600 shadow-md bg-amber-50/30" },
  { key: "mati", kondisiKey: "mati", label: "Rusak Berat", icon: XCircle, tone: "text-rose-600", bg: "bg-rose-50", ring: "border-rose-200", activeBg: "ring-2 ring-rose-600 shadow-md bg-rose-50/30" },
] as const

export function StatCards({ total, baik, bermasalah, mati, selectedKondisi = "all", onSelectKondisi }: Props) {
  const values: Record<string, number> = { total, baik, bermasalah, mati }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        const isSelected = selectedKondisi === c.kondisiKey
        return (
          <button
            key={c.key}
            type="button"
            onClick={() => {
              if (onSelectKondisi) {
                // If already selected, clicking it resets to "all" (except for total card)
                if (isSelected && c.kondisiKey !== "all") {
                  onSelectKondisi("all")
                } else {
                  onSelectKondisi(c.kondisiKey)
                }
              }
            }}
            className={`text-left rounded-2xl border ${c.ring} bg-white p-4.5 shadow-xs transition-all hover:shadow-md cursor-pointer relative overflow-hidden group ${
              isSelected ? c.activeBg : "hover:border-slate-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">
                {c.label}
              </span>
              <div className={`flex size-8 items-center justify-center rounded-lg ${c.bg} transition-transform group-hover:scale-105`}>
                <Icon className={`size-4.5 ${c.tone}`} aria-hidden />
              </div>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <p className="text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-800">
                {values[c.key]}
              </p>
              {isSelected && (
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  Filter Aktif
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
