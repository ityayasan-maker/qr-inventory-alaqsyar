"use client"

import React, { useState, useMemo } from "react"
import { X, Printer, Download, FileText, Filter, CheckCircle2, AlertTriangle, XCircle, Wrench, Building2, Layers } from "lucide-react"
import { kondisiStatus, kondisiMeta, getItemType, getCategoryFromItem, type InventoryItem } from "@/lib/inventory"
import { exportToExcel } from "@/lib/excel-utils"
import type { CategoryItem, UnitItem } from "@/lib/master-data"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  items: InventoryItem[]
  rooms: string[]
  categories: CategoryItem[]
  units: UnitItem[]
}

export function ReportModal({
  isOpen,
  onClose,
  items,
  rooms,
  categories,
  units,
}: ReportModalProps) {
  const [filterUnit, setFilterUnit] = useState<string>("all")
  const [filterRuangan, setFilterRuangan] = useState<string>("all")
  const [filterKondisi, setFilterKondisi] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [techSigner, setTechSigner] = useState("Pak Joko (Koordinator Teknisi IT)")
  const [leaderSigner, setLeaderSigner] = useState("Hanif Hikmat, S.Kom (Kepala IT / Pimpinan)")

  const reportDateStr = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const type = getItemType(item)
      const st = kondisiStatus(item.kondisi)

      if (filterType !== "all" && type !== filterType) return false
      if (filterUnit !== "all" && item.jurusan !== filterUnit) return false
      if (filterRuangan !== "all" && (item.lokasi || "").toLowerCase() !== filterRuangan.toLowerCase()) return false
      if (filterKondisi !== "all" && st !== filterKondisi) return false
      return true
    })
  }, [items, filterType, filterUnit, filterRuangan, filterKondisi])

  // Summary statistics
  const summary = useMemo(() => {
    const total = filteredItems.length
    const baik = filteredItems.filter((i) => kondisiStatus(i.kondisi) === "baik").length
    const rusakRingan = filteredItems.filter((i) => kondisiStatus(i.kondisi) === "bermasalah").length
    const rusakBerat = filteredItems.filter((i) => kondisiStatus(i.kondisi) === "mati").length
    const totalRepairs = filteredItems.reduce((acc, curr) => acc + (curr.repairLogs?.length || 0), 0)

    // Sum parsed costs if numeric
    let totalEstimatedCost = 0
    filteredItems.forEach((item) => {
      item.repairLogs?.forEach((log) => {
        if (log.biaya && log.biaya !== "-") {
          const num = parseInt(log.biaya.replace(/[^0-9]/g, ""), 10)
          if (!isNaN(num)) totalEstimatedCost += num
        }
      })
    })

    return { total, baik, rusakRingan, rusakBerat, totalRepairs, totalEstimatedCost }
  }, [filteredItems])

  if (!isOpen) return null

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = () => {
    exportToExcel(
      filteredItems,
      `Laporan-Inventaris-AlAqsyar-${new Date().toISOString().slice(0, 10)}.xlsx`
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      {/* Print Specific Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="relative my-6 w-full max-w-5xl rounded-2xl border border-violet-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80 no-print">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Pusat Cetak Laporan & Rekapitulasi Aset</h2>
              <p className="text-xs text-slate-500">Buat laporan resmi terfilter siap cetak (PDF) atau ekspor ke Excel</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Filter Controls (No Print) */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-white space-y-4 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Filter Jenis */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Aset</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
              >
                <option value="all">Semua Jenis (IT & Non-IT)</option>
                <option value="IT">Hanya Barang IT</option>
                <option value="NON_IT">Hanya Barang Non-IT / HR-GA</option>
              </select>
            </div>

            {/* Filter Unit */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Unit / Jurusan</label>
              <select
                value={filterUnit}
                onChange={(e) => setFilterUnit(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
              >
                <option value="all">Semua Unit / Jurusan</option>
                {units.map((u) => (
                  <option key={u.id} value={u.code}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Ruangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi Ruangan</label>
              <select
                value={filterRuangan}
                onChange={(e) => setFilterRuangan(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
              >
                <option value="all">Semua Ruangan</option>
                {rooms.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kondisi */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Kondisi Barang</label>
              <select
                value={filterKondisi}
                onChange={(e) => setFilterKondisi(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500"
              >
                <option value="all">Semua Kondisi</option>
                <option value="baik">Hanya Kondisi Baik</option>
                <option value="bermasalah">Hanya Rusak Ringan</option>
                <option value="mati">Hanya Rusak Berat</option>
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                {filteredItems.length} unit terpilih
              </span>
              <span>Siap dilaporkan</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <Download className="size-3.5" />
                <span>Unduh Excel</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-sm transition-all"
              >
                <Printer className="size-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>
        </div>

        {/* Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/50">
          <div id="printable-report-area" className="mx-auto max-w-4xl bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
            {/* Kop Surat Dokumen */}
            <div className="flex items-center gap-4 pb-4 border-b-2 border-slate-800">
              <div className="size-16 shrink-0 flex items-center justify-center p-1">
                <img src="/logo-alaqsyar.png" alt="Logo Al-Aqsyar" className="size-full object-contain" />
              </div>
              <div className="flex-1 text-center">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-wide uppercase">
                  YAYASAN PENDIDIKAN ISLAM AL-AQSYAR
                </h1>
                <h2 className="text-sm font-bold text-purple-800 uppercase">
                  SMK AL-AQSYAR &bull; SISTEM MANAJEMEN ASET &amp; INVENTARIS
                </h2>
                <p className="text-[11px] text-slate-600">
                  Jl. Al-Aqsyar No. 01, Cileungsi, Kab. Bogor &bull; Email: it@alaqsyar.sch.id
                </p>
              </div>
            </div>

            {/* Judul Laporan */}
            <div className="my-5 text-center">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 underline uppercase tracking-wider">
                LAPORAN REKAPITULASI ASET DAN STATUS KONDISI BARANG
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dicetak pada: {reportDateStr} &bull; Filter: {filterType !== "all" ? filterType : "Semua Jenis"} &bull; {filterUnit !== "all" ? `Unit: ${filterUnit}` : "Semua Unit"} &bull; {filterRuangan !== "all" ? `Ruang: ${filterRuangan}` : "Semua Ruangan"}
              </p>
            </div>

            {/* Ringkasan Eksekutif (Card Statistik) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 text-center">
              <div className="border border-slate-200 bg-slate-50 p-2.5 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Unit Terdata</p>
                <p className="text-xl font-black text-slate-800">{summary.total}</p>
              </div>
              <div className="border border-emerald-200 bg-emerald-50/60 p-2.5 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Kondisi Baik</p>
                <p className="text-xl font-black text-emerald-800">
                  {summary.baik} <span className="text-[10px] font-normal text-emerald-600">({summary.total > 0 ? Math.round((summary.baik / summary.total) * 100) : 0}%)</span>
                </p>
              </div>
              <div className="border border-amber-200 bg-amber-50/60 p-2.5 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-amber-700">Rusak Ringan</p>
                <p className="text-xl font-black text-amber-800">{summary.rusakRingan}</p>
              </div>
              <div className="border border-rose-200 bg-rose-50/60 p-2.5 rounded-lg">
                <p className="text-[10px] uppercase font-bold text-rose-700">Rusak Berat</p>
                <p className="text-xl font-black text-rose-800">{summary.rusakBerat}</p>
              </div>
            </div>

            {/* Tabel Data Aset */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 text-[11px] uppercase">
                    <th className="p-2 border border-slate-300 w-8 text-center">No</th>
                    <th className="p-2 border border-slate-300">Kode Aset</th>
                    <th className="p-2 border border-slate-300">Nama Barang / Device</th>
                    <th className="p-2 border border-slate-300">Unit / Jurusan</th>
                    <th className="p-2 border border-slate-300">Lokasi Ruangan</th>
                    <th className="p-2 border border-slate-300">Spesifikasi / Merek</th>
                    <th className="p-2 border border-slate-300 text-center">Kondisi</th>
                    <th className="p-2 border border-slate-300 text-center">Servis</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => {
                    const status = kondisiStatus(item.kondisi)
                    const meta = kondisiMeta[status]
                    const repairCount = item.repairLogs ? item.repairLogs.length : 0
                    return (
                      <tr key={item.kode} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                        <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border border-slate-300 font-mono font-bold text-slate-900">{item.kode}</td>
                        <td className="p-2 border border-slate-300 font-semibold text-slate-800">{item.namaPc || "-"}</td>
                        <td className="p-2 border border-slate-300">{item.jurusan}</td>
                        <td className="p-2 border border-slate-300">{item.lokasi || "-"}</td>
                        <td className="p-2 border border-slate-300 text-slate-600">
                          {getItemType(item) === "NON_IT" ? item.merekModel || item.bahanWarna || "-" : item.prosesor || "-"}
                        </td>
                        <td className="p-2 border border-slate-300 text-center">
                          <span className="font-bold text-[10px]">
                            {meta.label}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-300 text-center font-mono font-semibold">
                          {repairCount}x
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Kolom Tanda Tangan */}
            <div className="mt-12 pt-6 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="text-slate-600 mb-1">Disiapkan Oleh (Teknisi / Admin IT):</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">{techSigner}</p>
                <p className="text-[11px] text-slate-500">Staf IT &amp; Inventaris Lapangan</p>
              </div>

              <div>
                <p className="text-slate-600 mb-1">Mengetahui / Menyetujui:</p>
                <div className="h-16" />
                <p className="font-bold text-slate-900 underline">{leaderSigner}</p>
                <p className="text-[11px] text-slate-500">Kepala Bagian IT / Pimpinan Sekolah</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (No Print) */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-3.5 bg-slate-50 no-print">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700 shadow-xs"
          >
            <Printer className="size-3.5" />
            <span>Cetak Dokumen Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  )
}
