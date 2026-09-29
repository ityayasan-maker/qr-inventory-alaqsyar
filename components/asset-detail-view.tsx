"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw } from "lucide-react"
import {
  getStoredInventory,
  getCategoryFromItem,
  KATEGORI_DEVICE,
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
  const [loading, setLoading] = useState(false)

  // Live fetch latest item from server API + local storage fallback
  useEffect(() => {
    const stored = getStoredInventory()
    const found = stored.find((i) => i.kode === kode)
    if (found) {
      setItem(found)
    }

    async function fetchLive() {
      setLoading(true)
      try {
        const res = await fetch("/api/inventory")
        if (res.ok) {
          const list: InventoryItem[] = await res.json()
          const liveFound = list.find((i) => i.kode === kode)
          if (liveFound) {
            setItem(liveFound)
          }
        }
      } catch (e) {
        console.warn("Live API fetch error, using stored data", e)
      } finally {
        setLoading(false)
      }
    }

    fetchLive()
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
          <h1 className="text-xl font-bold text-rose-400">Barang Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kode aset <span className="font-mono text-sky-300">{kode}</span> tidak terdaftar atau sudah dihapus.
          </p>
        </div>
      </main>
    )
  }

  const status = kondisiStatus(item.kondisi)
  const meta = kondisiMeta[status]
  const katKey = getCategoryFromItem(item)
  const katObj = KATEGORI_DEVICE.find((k) => k.key === katKey)
  const katLabel = katObj ? katObj.label : katKey

  // Dynamically tailor field labels based on Device Category
  const isPc = katKey === "PC" || katKey === "CPU"
  const isLaptop = katKey === "LAP"
  const isPrinter = katKey === "PRN"
  const isProjector = katKey === "PROJ"
  const isRouter = katKey === "RTR"
  const isMonitor = katKey === "MON"

  const rows: [string, string][] = []

  // Name
  if (isPc) rows.push(["Nama PC", item.namaPc])
  else if (isLaptop) rows.push(["Nama Laptop / Merek", item.namaPc])
  else if (isPrinter) rows.push(["Nama Printer", item.namaPc])
  else if (isProjector) rows.push(["Nama Proyektor", item.namaPc])
  else if (isRouter) rows.push(["Nama Perangkat Jaringan", item.namaPc])
  else if (isMonitor) rows.push(["Merek & Ukuran Monitor", item.namaPc])
  else rows.push(["Nama Barang / Merek", item.namaPc])

  // Category & Unit
  rows.push(["Kategori Device", katLabel])
  rows.push(["Unit Pemilik", item.jurusan])
  rows.push(["Lokasi Ruangan", item.lokasi])

  // Specs / Processors
  if (isPc || isLaptop) {
    if (item.prosesor && item.prosesor !== "-") rows.push(["Prosesor", item.prosesor])
    if (item.ram && item.ram !== "-") rows.push(["Kapasitas RAM", item.ram])
    if (item.storage && item.storage !== "-") rows.push(["Penyimpanan", item.storage])
    if (item.os && item.os !== "-") rows.push(["Sistem Operasi", item.os])
    if (isPc && item.motherboard && item.motherboard !== "-") rows.push(["Motherboard", item.motherboard])
    if (isPc && item.monitor && item.monitor !== "-") rows.push(["Monitor", item.monitor])
    if (isPc && item.casing && item.casing !== "-") rows.push(["Merek Casing", item.casing])
    if (isLaptop && item.monitor && item.monitor !== "-") rows.push(["Ukuran Layar", item.monitor])
    if (isLaptop && item.motherboard && item.motherboard !== "-") rows.push(["Serial Number", item.motherboard])
  } else {
    // Non-PC General Items (Printer, Router, Projector, Monitor, UPS, etc.)
    if (item.prosesor && item.prosesor !== "-") {
      rows.push([isProjector ? "Lumens / Resolusi" : isRouter ? "Chipset / Frekuensi" : "Spesifikasi", item.prosesor])
    }
    if (item.os && item.os !== "-") rows.push(["Firmware / OS", item.os])
    if (item.motherboard && item.motherboard !== "-") rows.push(["Serial Number / Model", item.motherboard])
    if (item.ram && item.ram !== "-") rows.push(["RAM / Memori", item.ram])
    if (item.storage && item.storage !== "-") rows.push(["Storage", item.storage])
  }

  if (item.catatan && item.catatan !== "-") {
    rows.push(["Catatan", item.catatan])
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Kembali ke daftar
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl relative">
        {loading && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 text-xs text-sky-400">
            <RefreshCw className="size-3.5 animate-spin" />
            <span>Memutakhirkan...</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="rounded-md border border-sky-500/40 bg-sky-500/10 px-2 py-0.5 font-mono text-xs font-bold text-sky-300">
            [{katKey}] {katLabel}
          </span>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="font-mono text-lg font-bold text-sky-400">{item.kode}</h1>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-xl font-semibold text-foreground">{item.namaPc || "Tanpa Nama"}</p>

        <dl className="mt-6 divide-y divide-border">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-3 py-2.5">
              <dt className="text-sm text-muted-foreground font-medium">{label}</dt>
              <dd className="col-span-2 text-sm text-foreground">{value || "-"}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Isi QR terhubung langsung dengan sistem inventaris live Al-Aqsyar. Data otomatis ter-update secara real-time.
      </p>
    </main>
  )
}
