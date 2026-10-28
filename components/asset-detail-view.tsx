"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, RefreshCw, Armchair, Laptop, Wrench, Plus, CheckCircle2, ShieldCheck, Calendar, DollarSign, UserCheck, KeyRound, AlertCircle } from "lucide-react"
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
import { getStoredSession, loginAdmin, type UserSession } from "@/lib/auth"

interface AssetDetailViewProps {
  initialItem: InventoryItem | null
  kode: string
}

export function AssetDetailView({ initialItem, kode }: AssetDetailViewProps) {
  const [item, setItem] = useState<InventoryItem | null>(initialItem)
  const [session, setSession] = useState<UserSession | null>(null)
  const [loading, setLoading] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New Repair Log Form State (Update Poin 3 untuk Pak Joko)
  const [isAddingRepair, setIsAddingRepair] = useState(false)
  const [isQuickAuthOpen, setIsQuickAuthOpen] = useState(false)
  const [quickAuthPass, setQuickAuthPass] = useState("")
  const [quickAuthError, setQuickAuthError] = useState<string | null>(null)

  const [repairDate, setRepairDate] = useState(new Date().toISOString().slice(0, 10))
  const [repairDesc, setRepairDesc] = useState("")
  const [repairTech, setRepairTech] = useState("Pak Joko")
  const [repairCost, setRepairCost] = useState("")
  const [repairKondisi, setRepairKondisi] = useState<string>("Baik")

  useEffect(() => {
    const currentSession = getStoredSession()
    setSession(currentSession)
    if (currentSession?.name.includes("Joko")) {
      setRepairTech("Pak Joko (Teknisi IT)")
    }

    const stored = getStoredInventory()
    const found = stored.find((i) => i.kode === kode)
    if (found) {
      setItem(found)
      setRepairKondisi(found.kondisi || "Baik")
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
            setRepairKondisi(liveFound.kondisi || "Baik")
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

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  // Handle Quick Auth for Pak Joko / Teknisi
  const handleQuickAuth = (e: React.FormEvent) => {
    e.preventDefault()
    setQuickAuthError(null)
    const res = loginAdmin("pakjoko", quickAuthPass)
    if (res.success && res.session) {
      setSession(res.session)
      setIsQuickAuthOpen(false)
      setIsAddingRepair(true)
      showToast("Berhasil login sebagai Pak Joko / Teknisi IT")
    } else {
      setQuickAuthError("Password teknisi/admin tidak valid")
    }
  }

  const handleAddRepairLog = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item || !repairDesc.trim()) return

    const newLog: RepairLog = {
      id: `rep-${Date.now()}`,
      tanggal: repairDate || new Date().toISOString().slice(0, 10),
      keterangan: repairDesc.trim(),
      teknisi: repairTech.trim() || "Pak Joko (Teknisi IT)",
      biaya: repairCost.trim() || "-",
    }

    const updatedLogs = [newLog, ...(item.repairLogs || [])]
    const updatedItem: InventoryItem = {
      ...item,
      kondisi: repairKondisi,
      repairLogs: updatedLogs,
    }

    setItem(updatedItem)

    // Save to local storage
    const allStored = getStoredInventory()
    const updatedAll = allStored.map((i) => (i.kode === kode ? updatedItem : i))
    saveStoredInventory(updatedAll)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("inventory_updated"))
    }

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
    setRepairCost("")
    setIsAddingRepair(false)
    showToast("Riwayat perbaikan berhasil disimpan & kondisi barang diperbarui!")
  }

  if (!item) {
    return (
      <main className="mx-auto min-h-dvh w-full max-w-lg px-4 py-8 text-center">
        {session && (
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 hover:text-purple-800"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Dashboard Admin
          </Link>
        )}
        <div className="rounded-2xl border border-rose-200 bg-white p-8 shadow-xl">
          <h1 className="text-xl font-bold text-rose-600">Barang Tidak Ditemukan</h1>
          <p className="mt-2 text-sm text-slate-600">
            Kode aset <span className="font-mono font-bold text-purple-700">{kode}</span> tidak terdaftar atau sudah dihapus.
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
            className="inline-flex items-center gap-2 text-xs font-bold text-purple-700 hover:underline"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Dashboard Admin ({session.name})
          </Link>
          <span className="rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 flex items-center gap-1">
            <ShieldCheck className="size-3" />
            {session.role === "superadmin" ? "Super Admin" : "Admin"}
          </span>
        </div>
      ) : (
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3.5 py-1 text-xs font-bold text-purple-700 shadow-xs">
            Kartu Inventaris Resmi SMK Al-Aqsyar
          </span>
        </div>
      )}

      {/* Header Logo SMK Al-Aqsyar */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-white p-1 border border-purple-100 shadow-sm overflow-hidden shrink-0">
          <img src="/logo-alaqsyar.png" alt="Logo Al-Aqsyar" className="size-full object-contain" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 leading-tight">SMK AL-AQSYAR</h2>
          <p className="text-[10px] text-slate-500 font-medium">Sistem Inventaris Aset Resmi</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl relative">
        {loading && (
          <div className="absolute right-4 top-4 flex items-center gap-1.5 text-xs text-purple-600 font-medium">
            <RefreshCw className="size-3.5 animate-spin" />
            <span>Memutakhirkan...</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-xs font-bold ${
            itemType === "NON_IT"
              ? "border-amber-200 bg-amber-50 text-amber-800"
              : "border-purple-200 bg-purple-50 text-purple-800"
          }`}>
            {itemType === "NON_IT" ? <Armchair className="size-3.5" /> : <Laptop className="size-3.5" />}
            <span>[{katKey}] {katLabel}</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
            {itemType === "NON_IT" ? "Aset HR / GA" : "Aset IT"}
          </span>
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Kode Inventaris</span>
            <h1 className="font-mono text-xl font-extrabold text-purple-700">{item.kode}</h1>
          </div>
          <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${meta.className}`}>
            {meta.label}
          </span>
        </div>
        <p className="mt-1 text-lg font-bold text-slate-800">{item.namaPc || "Tanpa Nama"}</p>

        {/* Specifications Table */}
        <dl className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 p-2">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-3 gap-2 px-3 py-2.5">
              <dt className="text-xs font-semibold text-slate-500">{label}</dt>
              <dd className="col-span-2 text-xs font-medium text-slate-800">{value || "-"}</dd>
            </div>
          ))}
        </dl>

        {/* REPAIR LOGS SECTION (TRACKING RIWAYAT PERBAIKAN SETELAH SCAN) */}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Wrench className="size-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">Riwayat Perbaikan Unit</h2>
                <p className="text-[11px] text-slate-500">Histori perbaikan &amp; perawatan berkala</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-100 border border-amber-200 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-800">
              {logs.length}x Perbaikan
            </span>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Trigger Button (Bisa diakses siapa saja, jika belum login akan verifikasi password cepat) */}
          {!isAddingRepair && !isQuickAuthOpen && (
            <button
              type="button"
              onClick={() => {
                if (session) {
                  setIsAddingRepair(true)
                } else {
                  setIsQuickAuthOpen(true)
                }
              }}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-purple-300 bg-purple-50 px-4 py-2.5 text-xs font-bold text-purple-800 hover:bg-purple-100 transition-all w-full justify-center shadow-xs cursor-pointer"
            >
              <Plus className="size-4 text-purple-600" />
              <span>+ Catat Perbaikan Unit (Pak Joko / Teknisi IT)</span>
            </button>
          )}

          {/* Form Verifikasi Cepat jika Teknisi scan dari HP belum login */}
          {isQuickAuthOpen && !session && (
            <form onSubmit={handleQuickAuth} className="mt-4 rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <KeyRound className="size-4 text-amber-700" />
                <span>Verifikasi Akses Teknisi / Admin</span>
              </div>
              <p className="text-[11px] text-slate-600">
                Masukkan password IT Yayasan untuk mencatat perbaikan unit ini langsung dari HP.
              </p>

              {quickAuthError && (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2 rounded-lg">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{quickAuthError}</span>
                </div>
              )}

              <div>
                <input
                  type="password"
                  value={quickAuthPass}
                  onChange={(e) => setQuickAuthPass(e.target.value)}
                  placeholder="Password Teknisi (ITYAYASAN1999)"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-purple-500 shadow-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsQuickAuthOpen(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-xs cursor-pointer"
                >
                  <UserCheck className="size-3.5" />
                  <span>Masuk &amp; Catat Perbaikan</span>
                </button>
              </div>
            </form>
          )}

          {/* Form Tambah Log Perbaikan Cepat (Update Poin 3 untuk Pak Joko) */}
          {isAddingRepair && session && (
            <form onSubmit={handleAddRepairLog} className="mt-4 rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Wrench className="size-3.5 text-purple-700" />
                  <span>Catat Perbaikan / Servis Baru</span>
                </p>
                <span className="text-[10px] text-purple-700 bg-purple-100 font-bold px-2 py-0.5 rounded-full">
                  Petugas: {session.name}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Tanggal Servis</label>
                  <input
                    type="date"
                    value={repairDate}
                    onChange={(e) => setRepairDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Nama Teknisi / PJ</label>
                  <input
                    type="text"
                    value={repairTech}
                    onChange={(e) => setRepairTech(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: Pak Joko"
                    required
                  />
                </div>
              </div>

              {/* Quick Tech Selector Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Pilihan Cepat:</span>
                {["Pak Joko", "Tim IT Al-Aqsyar", "Vendor Luar"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRepairTech(t)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border cursor-pointer ${
                      repairTech.startsWith(t)
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Tindakan / Detail Perbaikan *</label>
                <input
                  type="text"
                  value={repairDesc}
                  onChange={(e) => setRepairDesc(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-500"
                  placeholder="Contoh: Ganti Power Supply 500W &amp; Install Ulang Windows"
                  required
                />
              </div>

              {/* Preset Tindakan Umum */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500">Pilihan Cepat:</span>
                {[
                  "Ganti Thermal Paste & Bersihkan Debu",
                  "Ganti Power Supply",
                  "Install Ulang Windows & Driver",
                  "Ganti / Tambah RAM",
                  "Ganti SSD / Harddisk",
                ].map((act) => (
                  <button
                    key={act}
                    type="button"
                    onClick={() => setRepairDesc(act)}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer"
                  >
                    {act}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Biaya (Opsional)</label>
                  <input
                    type="text"
                    value={repairCost}
                    onChange={(e) => setRepairCost(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Rp 250.000 / -"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Status Kondisi Setelah Servis</label>
                  <select
                    value={repairKondisi}
                    onChange={(e) => setRepairKondisi(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-purple-500"
                  >
                    <option value="Baik">Kondisi Baik (Selesai/Siap Pakai)</option>
                    <option value="Rusak Ringan">Rusak Ringan (Masih Diproses)</option>
                    <option value="Rusak Berat">Rusak Berat (Tidak Bisa Diperbaiki)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingRepair(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="size-3.5" />
                  <span>Simpan &amp; Perbarui Status Barang</span>
                </button>
              </div>
            </form>
          )}

          {/* List Log Perbaikan */}
          <div className="mt-3.5 space-y-2">
            {logs.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                <p className="text-xs text-slate-500 italic">
                  Belum ada riwayat perbaikan yang dicatat untuk barang ini.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs space-y-1 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="font-mono font-bold text-purple-700">{log.tanggal}</span>
                    <span className="font-medium text-slate-600">Teknisi: {log.teknisi || "Tim IT/GA"}</span>
                  </div>
                  <p className="font-semibold text-slate-800">{log.keterangan}</p>
                  {log.biaya && log.biaya !== "-" && (
                    <p className="text-[11px] text-emerald-700 font-bold">Biaya: {log.biaya}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <p className="mt-5 text-center text-xs text-slate-400">
        Kartu Inventaris Resmi Al-Aqsyar &middot; Data terhubung langsung secara real-time.
      </p>
    </main>
  )
}
