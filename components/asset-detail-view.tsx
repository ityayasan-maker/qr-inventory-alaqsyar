"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Cpu, HardDrive, MemoryStick, MapPin, QrCode } from "lucide-react"
import {
  inventory as defaultRawInventory,
  getStoredInventory,
  kondisiStatus,
  kondisiMeta,
  type InventoryItem,
} from "@/lib/inventory"

interface AssetDetailViewProps {
  initialItem: InventoryItem | null
  kode: string
}

export function AssetDetailView({ initialItem, kode }: AssetDetailViewProps) {
  const [item, setItem] = useState<InventoryItem | null>(initialItem)

  useEffect(() => {
    const stored = getStoredInventory()
    const found = stored.find((i) => i.kode === kode)
    if (found) {
      setItem(found)
    }
  }, [kode])

  if (!item) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8 text-center">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kembali ke daftar
        </Link>
        <div className="rounded-2xl border border-rose-500/30 bg-card p-8 shadow-xl">
          <h1 className="text-xl font-bold text-rose-400">Unit Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kode aset <span className="font-mono text-sky-300">{kode}</span> tidak terdaftar atau sudah dihapus.
          </p>
        </div>
      </main>
    )
  }

  const status = kondisiStatus(item.kondisi)
  const meta = kondisiMeta[status]

  const rows: [string, string][] = [
    ["Nama PC", item.namaPc],
    ["Jurusan / Lab", item.jurusan],
    ["Lokasi", item.lokasi],
    ["Prosesor", item.prosesor],
    ["RAM", item.ram],
    ["Storage", item.storage],
    ["Motherboard", item.motherboard],
    ["Sistem Operasi", item.os],
    ["Monitor", item.monitor],
    ["Keyboard", item.keyboard],
    ["Mouse", item.mouse],
    ["Merek Casing", item.casing],
    ["Catatan", item.catatan],
  ]

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke daftar
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Inventaris IT Al-Aqsyar</p>
        <div className="mt-2 flex items-start justify-between gap-3">
          <h1 className="font-mono text-lg font-semibold text-sky-300">{item.kode}</h1>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-xl font-semibold text-foreground">{item.namaPc || "Tanpa Nama"}</p>

        <dl className="mt-6 divide-y divide-border">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-3 py-2.5">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="col-span-2 text-sm text-foreground">{value || "-"}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Data langsung dari basis data inventaris. Pindai ulang kapan saja untuk info terbaru.
      </p>
    </main>
  )
}
