import { Monitor, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

type Props = {
  total: number
  baik: number
  bermasalah: number
  mati: number
}

const cards = [
  { key: "total", label: "Total Unit Aset", icon: Monitor, tone: "text-purple-600", bg: "bg-purple-50", ring: "border-purple-200" },
  { key: "baik", label: "Kondisi Baik", icon: CheckCircle2, tone: "text-emerald-600", bg: "bg-emerald-50", ring: "border-emerald-200" },
  { key: "bermasalah", label: "Rusak Ringan", icon: AlertTriangle, tone: "text-amber-600", bg: "bg-amber-50", ring: "border-amber-200" },
  { key: "mati", label: "Rusak Berat", icon: XCircle, tone: "text-rose-600", bg: "bg-rose-50", ring: "border-rose-200" },
] as const

export function StatCards(props: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className={`rounded-2xl border ${c.ring} bg-white p-4.5 shadow-xs transition-shadow hover:shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">{c.label}</span>
              <div className={`flex size-8 items-center justify-center rounded-lg ${c.bg}`}>
                <Icon className={`size-4.5 ${c.tone}`} aria-hidden />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums text-slate-800">
              {props[c.key]}
            </p>
          </div>
        )
      })}
    </div>
  )
}
