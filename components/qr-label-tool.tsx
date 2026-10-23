"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "qrcode"
import { Download, Printer, Search, QrCode, Check, Building2 } from "lucide-react"
import { inventory as defaultRawInventory, getStoredInventory, saveStoredInventory, JURUSAN, type InventoryItem } from "@/lib/inventory"
import { getStoredRooms } from "@/lib/rooms"

const LABELS = {
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
  small: {
    name: "Standar 50 × 30 mm (Dengan Details)",
    w: 50,
    h: 30,
    qrPx: 90,
    fontSize: 8,
    compact: false,
  },
  large: {
    name: "Besar 70 × 40 mm (Dengan Details)",
    w: 70,
    h: 40,
    qrPx: 120,
    fontSize: 10,
    compact: false,
  },
} as const

type LabelSize = keyof typeof LABELS

function assetUrl(kode: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : ""
  return `${origin}/a/${encodeURIComponent(kode)}`
}

export function QrLabelTool() {
  const [items, setItems] = useState<InventoryItem[]>(defaultRawInventory)
  const [rooms, setRooms] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [jurusan, setJurusan] = useState("all")
  const [ruangan, setRuangan] = useState("all")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [size, setSize] = useState<LabelSize>("compact4col")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setItems(getStoredInventory())
    setRooms(getStoredRooms())

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (jurusan !== "all" && i.jurusan !== jurusan) return false
      if (ruangan !== "all" && (i.lokasi || "").toLowerCase() !== ruangan.toLowerCase()) return false
      if (!q) return true
      return `${i.kode} ${i.namaPc} ${i.lokasi}`.toLowerCase().includes(q)
    })
  }, [items, query, jurusan, ruangan])

  function toggle(kode: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(kode)) next.delete(kode)
      else next.add(kode)
      return next
    })
  }

  function selectAllFiltered() {
    setSelected(new Set(filtered.map((i) => i.kode)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  const selectedItems = useMemo(
    () => items.filter((i) => selected.has(i.kode)),
    [items, selected],
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
          if (compact) {
            return `<div class="label compact">
                <img class="qr" src="${qr}" alt="QR ${escapeHtml(item.kode)}" />
                <div class="kode">${escapeHtml(item.kode)}</div>
              </div>`
          }
          return `<div class="label">
              <img class="qr" src="${qr}" alt="QR ${escapeHtml(item.kode)}" />
              <div class="meta">
                <div class="org">Inventaris IT Al-Aqsyar</div>
                <div class="kode">${escapeHtml(item.kode)}</div>
                <div class="nama">${escapeHtml(item.namaPc || "Tanpa Nama")}</div>
                <div class="jurusan">${escapeHtml(item.jurusan)}</div>
              </div>
            </div>`
        })
        .join("")

      const html = `<!doctype html>
        <html lang="id">
        <head>
        <meta charset="utf-8" />
        <title>Label QR Inventaris Al-Aqsyar</title>
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
            border: 0.2mm dashed #aaa;
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
          .kode { font-size: ${fontSize}pt; font-weight: 800; font-family: "Courier New", monospace, sans-serif; letter-spacing: -0.2px; text-align: center; color: #000; line-height: 1; }
          .meta { min-width: 0; line-height: 1.2; }
          .org { font-size: 7pt; font-weight: 700; }
          .nama { font-size: 6.5pt; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
          .jurusan { font-size: 6pt; color: #555; margin-top: 0.5mm; }
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
        alert("Popup diblokir. Izinkan popup untuk mencetak/menyimpan PDF.")
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
      <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <span className="text-sm font-bold text-slate-800">
              <span className="text-purple-700">{selected.size}</span> unit dipilih untuk cetak
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={selectAllFiltered}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Pilih semua ({filtered.length})
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              >
                Kosongkan
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between">
            <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600">
              Ukuran &amp; Format Stiker:
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
              disabled={selected.size === 0 || busy}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? (
                "Membuat PDF..."
              ) : (
                <>
                  <Printer className="size-4" aria-hidden />
                  Cetak PDF ({selected.size} Label)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[{ key: "all", label: "Semua Unit" }, ...JURUSAN].map((f) => {
            const active = jurusan === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setJurusan(f.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "border-purple-600 bg-purple-600 text-white shadow-2xs"
                    : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
                aria-pressed={active}
              >
                {f.label}
              </button>
            )
          })}

          {/* Filter berdasarkan Ruangan / Lokasi */}
          <div className="relative inline-flex items-center">
            <Building2 className="pointer-events-none absolute left-2.5 size-3.5 text-slate-400" />
            <select
              value={ruangan}
              onChange={(e) => setRuangan(e.target.value)}
              className="rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500"
            >
              <option value="all">Semua Ruangan</option>
              {rooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode, nama, lokasi..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-purple-500 shadow-2xs"
            aria-label="Cari unit"
          />
        </div>
      </div>

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
          Tidak ada unit yang cocok dengan filter / ruangan ini.
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
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={checked}
          aria-label={checked ? "Batal pilih" : "Pilih unit"}
          className={`flex size-6 shrink-0 items-center justify-center rounded-lg border transition-colors ${
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
          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-purple-200 bg-purple-50 py-1.5 text-xs font-semibold text-purple-700 hover:bg-purple-100 shadow-2xs"
        >
          <Download className="size-3.5" />
          PNG
        </button>
      </div>
    </div>
  )
}
