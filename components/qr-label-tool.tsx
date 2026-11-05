"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "qrcode"
import { Download, Printer, Search, QrCode, Check, Building2, Filter, Layers, CheckCircle2 } from "lucide-react"
import {
  inventory as defaultRawInventory,
  getStoredInventory,
  saveStoredInventory,
  kondisiStatus,
  JURUSAN,
  type InventoryItem,
} from "@/lib/inventory"
import { getStoredRooms } from "@/lib/rooms"
import { getStoredCategories, type CategoryItem } from "@/lib/master-data"

const LABELS = {
  standarWithMeta: {
    name: "🏷️ Standar Sekolah (50 × 30 mm • QR, Kode, Nama & No PC)",
    w: 50,
    h: 30,
    qrPx: 85,
    fontSize: 7.5,
    compact: false,
  },
  large: {
    name: "📐 Label Besar (70 × 40 mm • Lengkap & Jelas)",
    w: 70,
    h: 40,
    qrPx: 115,
    fontSize: 9.5,
    compact: false,
  },
  compact4col: {
    name: "⚡ Super Hemat (4 Kolom • Hanya QR & Kode Aset)",
    w: 44,
    h: 30,
    qrPx: 75,
    fontSize: 7.5,
    compact: true,
  },
  mini4col: {
    name: "📏 Mini Stiker (4 Kolom • 38 × 24 mm)",
    w: 38,
    h: 24,
    qrPx: 60,
    fontSize: 6.5,
    compact: true,
  },
} as const

type LabelSize = keyof typeof LABELS

export const OFFICIAL_DOMAIN = "https://inventaris.alaqsyar.sch.id"

function assetUrl(kode: string) {
  // Selalu prioritaskan domain resmi inventaris.alaqsyar.sch.id agar QR fisik valid
  return `${OFFICIAL_DOMAIN}/a/${encodeURIComponent(kode)}`
}

export function QrLabelTool() {
  const [items, setItems] = useState<InventoryItem[]>(defaultRawInventory)
  const [rooms, setRooms] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  
  // Filter States sesuai Bab 8 PDF
  const [kategoriFilter, setKategoriFilter] = useState<string>("all")
  const [jurusan, setJurusan] = useState("all")
  const [ruangan, setRuangan] = useState("all")
  const [kondisiFilter, setKondisiFilter] = useState("all")
  const [query, setQuery] = useState("")

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [size, setSize] = useState<LabelSize>("standarWithMeta")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const inv = getStoredInventory()
    setItems(inv)
    setRooms(getStoredRooms())
    setCategories(getStoredCategories().filter((c) => c.active && c.type === "IT"))
    setSelected(new Set(inv.map((i) => i.kode)))

    fetch("/api/inventory")
      .then((res) => (res.ok ? res.json() : null))
      .then((serverList: InventoryItem[] | null) => {
        if (Array.isArray(serverList) && serverList.length > 0) {
          const localList = getStoredInventory()
          const map = new Map<string, InventoryItem>()
          localList.forEach((item) => map.set(item.kode, item))
          serverList.forEach((item) => map.set(item.kode, item))
          const merged = Array.from(map.values())
          setItems(merged)
          saveStoredInventory(merged)
        }
      })
      .catch(() => {})

    const handleUpdate = () => {
      setItems(getStoredInventory())
      setRooms(getStoredRooms())
    }
    window.addEventListener("inventory_updated", handleUpdate)
    window.addEventListener("rooms_updated", handleUpdate)
    return () => {
      window.removeEventListener("inventory_updated", handleUpdate)
      window.removeEventListener("rooms_updated", handleUpdate)
    }
  }, [])

  // Filter & Urutkan berdasarkan kode aset (nomor urut kecil ke besar)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = items.filter((i) => {
      // 1. Filter Kategori
      if (kategoriFilter !== "all") {
        const itemKat = (i.kategori || "").toUpperCase()
        if (kategoriFilter === "PC" && itemKat !== "PC" && !i.kode.includes("-PC-")) return false
        if (kategoriFilter === "MON" && itemKat !== "MON" && !i.kode.includes("-MON-")) return false
        if (kategoriFilter === "RTR" && itemKat !== "RTR" && !i.kode.includes("-RTR-")) return false
        if (kategoriFilter === "SW" && itemKat !== "SW" && !i.kode.includes("-SW-")) return false
        if (!["PC", "MON", "RTR", "SW"].includes(kategoriFilter) && itemKat !== kategoriFilter) return false
      }

      // 2. Filter Jurusan
      if (jurusan !== "all" && i.jurusan !== jurusan) return false

      // 3. Filter Ruangan
      if (ruangan !== "all" && (i.lokasi || "").toLowerCase() !== ruangan.toLowerCase()) return false

      // 4. Filter Kondisi
      if (kondisiFilter !== "all" && kondisiStatus(i.kondisi) !== kondisiFilter) return false

      // 5. Pencarian Teks
      if (!q) return true
      const matchText = `${i.kode} ${i.namaPc} ${i.lokasi} ${i.noPc || ""}`.toLowerCase()
      return matchText.includes(q)
    })

    // Aturan 8.5: Urutkan berdasarkan kode aset (nomor urut kecil ke besar)
    return result.sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true, sensitivity: "base" }))
  }, [items, kategoriFilter, jurusan, ruangan, kondisiFilter, query])

  // Otomatis centang item yang sedang terfilter saat filter berubah
  function selectAllFiltered() {
    setSelected(new Set(filtered.map((i) => i.kode)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function toggle(kode: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(kode)) next.delete(kode)
      else next.add(kode)
      return next
    })
  }

  const selectedItems = useMemo(
    () => filtered.filter((i) => selected.has(i.kode)),
    [filtered, selected],
  )

  async function generatePdf() {
    if (selectedItems.length === 0) return
    setBusy(true)
    try {
      const labelConfig = LABELS[size]
      const { w, h, qrPx, fontSize, compact } = labelConfig

      const qrByKode = new Map<string, string>()
      await Promise.all(
        selectedItems.map(async (item) => {
          const url = await QRCode.toDataURL(assetUrl(item.kode), {
            margin: 0,
            width: 320,
            errorCorrectionLevel: "M",
          })
          qrByKode.set(item.kode, url)
        }),
      )

      const escapeHtml = (s: string) =>
        s.replace(/[&<>"']/g, (c) =>
          c === "&"
            ? "&amp;"
            : c === "<"
              ? "&lt;"
              : c === ">"
                ? "&gt;"
                : c === '"'
                  ? "&quot;"
                  : "&#39;",
        )

      const labels = selectedItems
        .map((item) => {
          const qr = qrByKode.get(item.kode) ?? ""
          const isMonitor = (item.kategori || "").toUpperCase() === "MON" || item.kode.includes("-MON-")
          
          if (compact) {
            return `<div class="label compact">
                <img class="qr" src="${qr}" alt="QR ${escapeHtml(item.kode)}" />
                <div class="kode">${escapeHtml(item.kode)}</div>
                ${isMonitor && item.noPc ? `<div class="pc-badge">PC: ${escapeHtml(item.noPc)}</div>` : ""}
              </div>`
          }

          return `<div class="label">
              <img class="qr" src="${qr}" alt="QR ${escapeHtml(item.kode)}" />
              <div class="meta">
                <div class="org">SMK AL-AQSYAR</div>
                <div class="kode">${escapeHtml(item.kode)}</div>
                <div class="nama">${escapeHtml(item.namaPc || "Tanpa Nama")}</div>
                <div class="lokasi">📍 ${escapeHtml(item.lokasi || item.jurusan)}</div>
                ${
                  isMonitor
                    ? `<div class="no-pc-tag">🖥️ No PC: <strong>${escapeHtml(item.noPc || "Cadangan/Stok")}</strong></div>`
                    : ""
                }
              </div>
            </div>`
        })
        .join("")

      const html = `<!doctype html>
        <html lang="id">
        <head>
        <meta charset="utf-8" />
        <title>Label Barcode QR Inventaris Al-Aqsyar</title>
        <style>
          @page { size: A4; margin: 6mm; }
          * { box-sizing: border-box; }
          body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; background: #fff; }
          .sheet {
            display: flex;
            flex-wrap: wrap;
            gap: 2.5mm 3mm;
            align-content: flex-start;
            justify-content: flex-start;
          }
          .label {
            width: ${w}mm;
            height: ${h}mm;
            border: 0.2mm dashed #999;
            border-radius: 1.5mm;
            padding: 1.5mm;
            display: flex;
            align-items: center;
            gap: 2mm;
            overflow: hidden;
            page-break-inside: avoid;
          }
          .label.compact {
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 0.8mm;
            text-align: center;
            padding: 1mm 0.5mm;
          }
          .qr { width: ${qrPx}px; height: ${qrPx}px; flex-shrink: 0; display: block; margin: 0 auto; }
          .kode { font-size: ${fontSize}pt; font-weight: 800; font-family: "Courier New", monospace, sans-serif; letter-spacing: -0.2px; color: #000; line-height: 1.1; }
          .meta { min-width: 0; line-height: 1.25; flex: 1; }
          .org { font-size: 6pt; font-weight: 800; color: #6b21a8; text-transform: uppercase; letter-spacing: 0.5px; }
          .nama { font-size: 6.5pt; font-weight: 600; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-top: 0.5mm; }
          .lokasi { font-size: 6pt; color: #475569; margin-top: 0.5mm; }
          .no-pc-tag { font-size: 6pt; background: #f3e8ff; border: 0.2mm solid #d8b4fe; border-radius: 1mm; padding: 0.3mm 1mm; margin-top: 0.8mm; display: inline-block; color: #581c87; }
          .pc-badge { font-size: 5.5pt; font-weight: bold; background: #ede9fe; color: #5b21b6; border-radius: 0.5mm; padding: 0.2mm 0.8mm; }
          @media print { body { background: #fff; } .label { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
        </head>
        <body>
          <div class="sheet">${labels}</div>
          <script>
            window.addEventListener("load", function () {
              setTimeout(function () { window.print(); }, 250);
            });
          </script>
        </body>
        </html>`

      const win = window.open("", "_blank")
      if (!win) {
        alert("Popup diblokir browser. Mohon izinkan popup untuk mencetak label.")
        return
      }
      win.document.open()
      win.document.write(html)
      win.document.close()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Target Domain Alert Info */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-purple-200 bg-purple-50/70 px-4 py-2.5 text-xs text-purple-950">
        <div className="flex items-center gap-2">
          <QrCode className="size-4 text-purple-700" />
          <span>
            QR Code ditargetkan ke domain resmi: <strong>{OFFICIAL_DOMAIN}</strong> (valid saat di-scan HP di lokasi sekolah).
          </span>
        </div>
      </div>

      {/* Control Panel: Counter & Print Actions */}
      <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-sm font-bold text-slate-800">
                Terpilih: <span className="text-purple-700 font-black text-base">{selectedItems.length}</span> barang
                <span className="text-slate-500 font-normal ml-1.5">(dari total {filtered.length} hasil filter)</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Pilih Semua ({filtered.length})
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Hapus Semua Centang
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              Format &amp; Ukuran Label:
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as LabelSize)}
                className="rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2 text-xs sm:text-sm font-semibold text-purple-900 outline-none focus:border-purple-500"
              >
                {Object.entries(LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={generatePdf}
              disabled={selectedItems.length === 0 || busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {busy ? (
                "Membuat Dokumen Label..."
              ) : (
                <>
                  <Printer className="size-4" aria-hidden />
                  Cetak / Simpan PDF ({selectedItems.length} Label)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* BAB 8.1 & 8.2: FILTER KATEGORI & FILTER TAMBAHAN */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
        {/* Filter Kategori Utama (Bab 8.1 PDF) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-2">
            Pilih Kategori Barang IT yang Ingin Dicetak:
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: "all", label: "Semua Kategori IT" },
              { key: "PC", label: "[PC] PC Saja" },
              { key: "MON", label: "[MON] Monitor Saja" },
              { key: "RTR", label: "[RTR] Router Saja" },
              { key: "SW", label: "[SW] Switch Saja" },
            ].map((kat) => {
              const active = kategoriFilter === kat.key
              return (
                <button
                  key={kat.key}
                  type="button"
                  onClick={() => setKategoriFilter(kat.key)}
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "border-purple-600 bg-purple-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-700 hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  {kat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter Tambahan (Bab 8.2 PDF) */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          {/* Filter Jurusan / Unit */}
          <div className="relative inline-flex items-center">
            <select
              value={jurusan}
              onChange={(e) => setJurusan(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500"
            >
              <option value="all">Semua Unit / Jurusan</option>
              {JURUSAN.map((j) => (
                <option key={j.key} value={j.key}>
                  {j.label}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Ruangan */}
          <div className="relative inline-flex items-center">
            <Building2 className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400" />
            <select
              value={ruangan}
              onChange={(e) => setRuangan(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500"
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
          <div className="relative inline-flex items-center">
            <CheckCircle2 className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400" />
            <select
              value={kondisiFilter}
              onChange={(e) => setKondisiFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500"
            >
              <option value="all">Semua Kondisi</option>
              <option value="baik">Kondisi Baik</option>
              <option value="bermasalah">Rusak Ringan</option>
              <option value="mati">Rusak Berat</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, nama, No PC..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-800 outline-none placeholder:text-slate-400 focus:border-purple-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Grid Kartu QR Label */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {filtered.map((item) => (
          <QrCard
            key={item.kode}
            item={item}
            checked={selected.has(item.kode)}
            onToggle={() => toggle(item.kode)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-slate-400 bg-white">
          Tidak ada barang pada kategori ini.
        </div>
      )}
    </div>
  )
}

function QrCard({
  item,
  checked,
  onToggle,
}: {
  item: InventoryItem
  checked: boolean
  onToggle: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isMonitor = (item.kategori || "").toUpperCase() === "MON" || item.kode.includes("-MON-")

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, assetUrl(item.kode), {
        margin: 1,
        width: 100,
        errorCorrectionLevel: "M",
      }).catch(() => {})
    }
  }, [item.kode])

  async function downloadPng() {
    const url = await QRCode.toDataURL(assetUrl(item.kode), {
      margin: 1,
      width: 512,
      errorCorrectionLevel: "M",
    })
    const a = document.createElement("a")
    a.href = url
    a.download = `qr-${item.kode}.png`
    a.click()
  }

  return (
    <div
      className={`rounded-2xl border bg-white p-3.5 transition-all shadow-2xs ${
        checked ? "border-purple-500 ring-2 ring-purple-500/20 shadow-xs" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-mono text-xs font-bold text-purple-700">{item.kode}</p>
          <p className="truncate text-xs font-bold text-slate-800">{item.namaPc || "Tanpa Nama"}</p>
          <p className="truncate text-[11px] text-slate-500">{item.lokasi || item.jurusan}</p>
          {isMonitor && (
            <p className="mt-1 inline-block rounded bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[10px] font-bold text-purple-800 truncate">
              🖥️ No PC: {item.noPc || "(Cadangan)"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={checked}
          aria-label={checked ? "Batal pilih" : "Pilih unit"}
          className={`flex size-6 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer ${
            checked
              ? "border-purple-600 bg-purple-600 text-white"
              : "border-slate-200 bg-slate-50 text-transparent hover:border-slate-300"
          }`}
        >
          <Check className="size-4" aria-hidden />
        </button>
      </div>

      <div className="mt-2.5 flex justify-center rounded-xl bg-slate-50 border border-slate-100 p-2">
        <canvas ref={canvasRef} aria-label={`QR untuk ${item.kode}`} />
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={`/a/${encodeURIComponent(item.kode)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
        >
          <QrCode className="size-3.5 text-purple-600" />
          Lihat
        </a>
        <button
          type="button"
          onClick={downloadPng}
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 shadow-2xs cursor-pointer"
        >
          <Download className="size-3.5" />
          PNG
        </button>
      </div>
    </div>
  )
}
