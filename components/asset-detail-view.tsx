"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Armchair, Laptop, Wrench, Plus, CheckCircle2, ShieldCheck } from "lucide-react"
import {
  getStoredInventory,
  saveStoredInventory,
  getCategoryFromItem,
  getItemType,
  kondisiStatus,
  kondisiMeta,
  type InventoryItem,
  type RepairLog,
} from "@/lib/inventory"
import { getStoredCategories } from "@/lib/master-data"
import { getStoredSession, type UserSession } from "@/lib/auth"

interface AssetDetailViewProps {
  initialItem: InventoryItem | null
  kode: string
}

export function AssetDetailView({ initialItem, kode }: AssetDetailViewProps) {
  const [item, setItem] = useState<InventoryItem | null>(initialItem)
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(false)

  // New Repair Log Form State
  const [isAddingRepair, setIsAddingRepair] = useState(false)
  const [repairDate, setRepairDate] = useState(new Date().toISOString().slice(0, 10))
  const [repairDesc, setRepairDesc] = useState("")
  const [repairTech, setRepairTech] = useState("")
  const [repairCost, setRepairCost] = useState("")

  useEffect(() => {
    setSession(getStoredSession())
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

  const handleAddRepairLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !repairDesc.trim()) return

    const newLog: RepairLog = {
      id: `rep-${Date.now()}`,
      tanggal: repairDate || new Date().toISOString().slice(0, 10),
      keterangan: repairDesc.trim(),
      teknisi: repairTech.trim() || "Tim IT / GA",
      biaya: repairCost.trim() || "-",
    }

    const updatedLogs = [newLog, ...(item.repairLogs || [])]
    const updatedItem = { ...item, repairLogs: updatedLogs }

    setItem(updatedItem)

    // Save to local storage
    const allStored = getStoredInventory()
    const updatedAll = allStored.map((i) => (i.kode === kode ? updatedItem : i))
    saveStoredInventory(updatedAll)

    // Sync API
    try {
      await fetch("/api/inventory", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      })
    } catch (err) {
      console.warn("API repair log sync error:", err)
    }

    setRepairDesc("")
    setRepairTech("")
    setRepairCost("")
    setIsAddingRepair(false)
  }

  if (!item) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8 text-center">
        {session && (
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Dashboard Admin
          </Link>
        )}
        <div className="rounded-2xl border border-rose-500/30 bg-card p-8 shadow-xl">
          <h1 className="text-xl font-bold text-rose-400">Barang Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Kode aset <span className="font-mono text-sky-300">{kode}</span> tidak terdaftar atau sudah dihapus.
          </p>
        </div>
      </main>
    )
  }

  const itemType = getItemType(item)
  const status = kondisiStatus(item.kondisi)
  const meta = kondisiMeta[status]
  const katKey = getCategoryFromItem(item)

  const masterCategories = getStoredCategories()
  const katObj = masterCategories.find((k) => k.code === katKey)
  const katLabel = katObj ? katObj.name : katKey

  const rows: [string, string][] = []

  if (itemType === "NON_IT") {
    rows.push(["Nama Barang", item.namaPc])
    rows.push(["Kode Inventaris HR/GA", item.kode])
    rows.push(["Kategori Barang", katLabel])
    rows.push(["Unit Pemilik", item.jurusan])
    rows.push(["Lokasi Ruangan", item.lokasi])
    if (item.merekModel && item.merekModel !== "-") rows.push(["Merek / Model", item.merekModel])
    if (item.bahanWarna && item.bahanWarna !== "-") rows.push(["Bahan / Warna", item.bahanWarna])
    if (item.tanggalPerolehan && item.tanggalPerolehan !== "-") rows.push(["Tanggal Perolehan", item.tanggalPerolehan])
    if (item.hargaPerolehan && item.hargaPerolehan !== "-") rows.push(["Harga Perolehan", item.hargaPerolehan])
    if (item.penanggungJawab && item.penanggungJawab !== "-") rows.push(["Penanggung Jawab", item.penanggungJawab])
  } else {
    // IT Items
    const isPc = katKey === "PC" || katKey === "CPU"
    const isLaptop = katKey === "LAP"
    const isPrinter = katKey === "PRN"
    const isProjector = katKey === "PROJ"
    const isRouter = katKey === "RTR"
    const isMonitor = katKey === "MON"

    if (isPc) rows.push(["Nama PC", item.namaPc])
    else if (isLaptop) rows.push(["Nama Laptop / Merek", item.namaPc])
    else if (isPrinter) rows.push(["Nama Printer", item.namaPc])
    else if (isProjector) rows.push(["Nama Proyektor", item.namaPc])
    else if (isRouter) rows.push(["Nama Perangkat Jaringan", item.namaPc])
    else if (isMonitor) rows.push(["Merek & Ukuran Monitor", item.namaPc])
    else rows.push(["Nama Barang / Merek", item.namaPc])

    rows.push(["Kategori Device", katLabel])
    rows.push(["Unit Pemilik", item.jurusan])
    rows.push(["Lokasi Ruangan", item.lokasi])

    if (isPc || isLaptop) {
      if (item.prosesor && item.prosesor !== "-") rows.push(["Prosesor", item.prosesor])
      if (item.ram && item.ram !== "-") rows.push(["Kapasitas RAM", item.ram])
      if (item.storage && item.storage !== "-") rows.push(["Penyimpanan", item.storage])
      if (item.os && item.os !== "-") rows.push(["Sistem Operasi", item.os])
      if (item.keyboard && item.keyboard !== "-") rows.push(["Kelengkapan Keyboard", item.keyboard])
      if (item.mouse && item.mouse !== "-") rows.push(["Kelengkapan Mouse", item.mouse])
      if (isPc && item.motherboard && item.motherboard !== "-") rows.push(["Motherboard", item.motherboard])
      if (isPc && item.monitor && item.monitor !== "-") rows.push(["Monitor", item.monitor])
      if (isPc && item.casing && item.casing !== "-") rows.push(["Merek Casing", item.casing])
      if (isLaptop && item.monitor && item.monitor !== "-") rows.push(["Ukuran Layar", item.monitor])
      if (isLaptop && item.motherboard && item.motherboard !== "-") rows.push(["Serial Number", item.motherboard])
    } else {
      if (item.prosesor && item.prosesor !== "-") {
        rows.push([isProjector ? "Lumens / Resolusi" : isRouter ? "Chipset / Frekuensi" : "Spesifikasi", item.prosesor])
      }
      if (item.os && item.os !== "-") rows.push(["Firmware / OS", item.os])
      if (item.keyboard && item.keyboard !== "-") rows.push(["Keyboard", item.keyboard])
      if (item.mouse && item.mouse !== "-") rows.push(["Mouse", item.mouse])
      if (item.motherboard && item.motherboard !== "-") rows.push(["Serial Number / Model", item.motherboard])
      if (item.ram && item.ram !== "-") rows.push(["RAM / Memori", item.ram])
      if (item.storage && item.storage !== "-") rows.push(["Storage", item.storage])
    }
  }

  if (item.catatan && item.catatan !== "-") {
    rows.push(["Catatan / Keterangan", item.catatan])
  }

  const logs = item.repairLogs || []

  return (
    <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8">
      {/* SECURITY REQUIREMENT: Hide Back Button for General Public/Students */}
      {session ? (
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Dashboard Admin ({session.name})
          </Link>
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="size-3" />
            {session.role === "superadmin" ? "Super Admin" : "Admin"}
          </span>
        </div>
      ) : (
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
            Kartu Inventaris Resmi Al-Aqsyar
          </span>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl relative">
        {loading && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 text-xs text-sky-400">
            <RefreshCw className="size-3.5 animate-spin" />
            <span>Memutakhirkan...</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-xs font-bold ${
            itemType === "NON_IT"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-sky-500/40 bg-sky-500/10 text-sky-300"
          }`}>
            {itemType === "NON_IT" ? <Armchair className="size-3.5" /> : <Laptop className="size-3.5" />}
            <span>[{katKey}] {katLabel}</span>
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {itemType === "NON_IT" ? "Aset HR / GA" : "Aset IT"}
          </span>
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <h1 className="font-mono text-lg font-bold text-sky-400">{item.kode}</h1>
          <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-xl font-semibold text-foreground">{item.namaPc || "Tanpa Nama"}</p>

        {/* Specifications Table */}
        <dl className="mt-6 divide-y divide-border">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-3 py-2.5">
              <dt className="text-sm text-muted-foreground font-medium">{label}</dt>
              <dd className="col-span-2 text-sm text-foreground">{value || "-"}</dd>
            </div>
          ))}
        </dl>

        {/* REPAIR LOGS SECTION (TRACKING RIWAYAT PERBAIKAN) */}
        <div className="mt-8 border-t border-border pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="size-4 text-amber-400" />
              <h2 className="text-sm font-bold text-foreground">Riwayat Perbaikan</h2>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.2 font-mono text-[11px] font-bold text-amber-300">
                {logs.length}x
              </span>
            </div>

            {session && !isAddingRepair && (
              <button
                type="button"
                onClick={() => setIsAddingRepair(true)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-sky-400 hover:underline"
              >
                <Plus className="size-3.5" />
                <span>+ Catatan</span>
              </button>
            )}
          </div>

          {/* Form Tambah Log Perbaikan (Khusus Admin) */}
          {isAddingRepair && session && (
            <form onSubmit={handleAddRepairLog} className="mt-4 rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-3">
              <p className="text-xs font-bold text-sky-300">Tambah Catatan Perbaikan / Service</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Tanggal</label>
                  <input
                    type="date"
                    value={repairDate}
                    onChange={(e) => setRepairDate(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground mb-1">Teknisi / Penanggung Jawab</label>
                  <input
                    type="text"
                    value={repairTech}
                    onChange={(e) => setRepairTech(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
                    placeholder="Tim IT / Pak Dede"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Detail Perbaikan *</label>
                <input
                  type="text"
                  value={repairDesc}
                  onChange={(e) => setRepairDesc(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
                  placeholder="Contoh: Ganti Thermal Paste & Power Supply 500W"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] text-muted-foreground mb-1">Biaya (Opsional)</label>
                <input
                  type="text"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none"
                  placeholder="Rp 250.000 / -"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingRepair(false)}
                  className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-3 py-1 text-xs font-bold text-white hover:bg-sky-400"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Simpan Catatan</span>
                </button>
              </div>
            </form>
          )}

          {/* List Log Perbaikan */}
          <div className="mt-3 space-y-2">
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">Belum ada riwayat perbaikan yang dicatat untuk barang ini.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-border bg-background p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="font-mono font-bold text-amber-400">{log.tanggal}</span>
                    <span>PJ: {log.teknisi || "Tim IT"}</span>
                  </div>
                  <p className="font-medium text-foreground">{log.keterangan}</p>
                  {log.biaya && log.biaya !== "-" && (
                    <p className="text-[11px] text-muted-foreground">Biaya: <span className="text-emerald-400 font-semibold">{log.biaya}</span></p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Kartu Inventaris Resmi Al-Aqsyar. Informasi khusus unit ini.
      </p>
    </main>
  )
}
