"use client"

import { useMemo, useState } from "react"
import { Search, Cpu, HardDrive, MemoryStick, MapPin } from "lucide-react"
import {
  inventory,
  JURUSAN,
  getStats,
  kondisiStatus,
  kondisiMeta,
  type InventoryItem,
} from "@/lib/inventory"
import { StatCards } from "@/components/stat-cards"

const FILTERS = [
  { key: "all", label: "Semua" },
  ...JURUSAN.map((j) => ({ key: j.key, label: j.label })),
] as const

export function InventoryDashboard() {
  const [jurusan, setJurusan] = useState<string>("all")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return inventory.filter((i) => {
      if (jurusan !== "all" && i.jurusan !== jurusan) return false
      if (!q) return true
      return [i.kode, i.namaPc, i.prosesor, i.motherboard, i.os, i.monitor, i.casing]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [jurusan, query])

  const stats = useMemo(() => getStats(filtered), [filtered])

  return (
    <div className="space-y-6">
      <StatCards {...stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = jurusan === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setJurusan(f.key)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode, prosesor, motherboard..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-sky-500/50"
            aria-label="Cari inventaris"
          />
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> unit
      </p>

      {/* Table for large screens */}
      <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Kode Aset</th>
                <th className="px-4 py-3 font-medium">Jurusan</th>
                <th className="px-4 py-3 font-medium">Nama PC</th>
                <th className="px-4 py-3 font-medium">Prosesor</th>
                <th className="px-4 py-3 font-medium">RAM</th>
                <th className="px-4 py-3 font-medium">Storage</th>
                <th className="px-4 py-3 font-medium">Monitor</th>
                <th className="px-4 py-3 font-medium">Kondisi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => {
                const status = kondisiStatus(item.kondisi)
                const meta = kondisiMeta[status]
                return (
                  <tr key={item.kode} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-sky-300">{item.kode}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.jurusan}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.namaPc || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.prosesor || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.ram || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.storage || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.monitor || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards for small screens */}
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {filtered.map((item) => (
          <InventoryCard key={item.kode} item={item} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          Tidak ada unit yang cocok dengan pencarian.
        </div>
      )}
    </div>
  )
}

function InventoryCard({ item }: { item: InventoryItem }) {
  const status = kondisiStatus(item.kondisi)
  const meta = kondisiMeta[status]
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-sky-300">{item.kode}</p>
          <p className="mt-0.5 font-medium text-foreground">{item.namaPc || "Tanpa Nama"}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Spec icon={Cpu} label={item.prosesor} />
        <Spec icon={MemoryStick} label={item.ram} />
        <Spec icon={HardDrive} label={item.storage} />
        <Spec icon={MapPin} label={item.jurusan} />
      </dl>
    </div>
  )
}

function Spec({ icon: Icon, label }: { icon: typeof Cpu; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
      <span className="truncate">{label || "-"}</span>
    </div>
  )
}
