import { Monitor, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

type Props = {
  total: number
  baik: number
  bermasalah: number
  mati: number
}

const cards = [
  { key: "total", label: "Total Unit PC", icon: Monitor, tone: "text-sky-400", ring: "ring-sky-500/20" },
  { key: "baik", label: "Kondisi Baik", icon: CheckCircle2, tone: "text-emerald-400", ring: "ring-emerald-500/20" },
  { key: "bermasalah", label: "Bermasalah", icon: AlertTriangle, tone: "text-amber-400", ring: "ring-amber-500/20" },
  { key: "mati", label: "Mati / Rusak", icon: XCircle, tone: "text-rose-400", ring: "ring-rose-500/20" },
] as const

export function StatCards(props: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className={`rounded-xl border border-border bg-card p-4 ring-1 ${c.ring}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <Icon className={`size-5 ${c.tone}`} aria-hidden />
            </div>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
              {props[c.key]}
            </p>
          </div>
        )
      })}
    </div>
  )
}
