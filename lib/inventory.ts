import raw from "./inventory.json"

export type ItemType = "IT" | "NON_IT"

export type InventoryItem = {
  type?: ItemType
  jurusan: string
  no?: string
  kode: string
  kategori?: string
  namaPc: string // Nama Barang / Nama Device
  
  // IT Specs
  prosesor?: string
  ram?: string
  storage?: string
  os?: string
  keyboard?: string
  mouse?: string
  monitor?: string
  casing?: string
  motherboard?: string
  
  // Non-IT Specs (HR/GA)
  merekModel?: string
  bahanWarna?: string
  tanggalPerolehan?: string
  hargaPerolehan?: string
  penanggungJawab?: string
  
  // Shared
  kondisi: string // "Baik" | "Rusak Ringan" | "Rusak Berat" / "Bermasalah" / "Mati"
  lokasi: string
  catatan?: string
}

export const inventory: InventoryItem[] = raw as InventoryItem[]

export function getItemType(item: InventoryItem): ItemType {
  if (item.type === "NON_IT") return "NON_IT"
  const kode = (item.kode || "").toUpperCase()
  if (kode.startsWith("GA-") || kode.startsWith("HR-") || kode.startsWith("NONIT-")) return "NON_IT"
  const kat = (item.kategori || "").toUpperCase()
  if (["MEJA", "KURSI", "AC", "LEMARI", "PAPAN", "SOUND", "ALAT", "LAIN_GA", "FASILITAS"].includes(kat)) return "NON_IT"
  return "IT"
}

export const JURUSAN = [
  { key: "TJKT", label: "TJKT" },
  { key: "MPLB", label: "MPLB" },
  { key: "DKV", label: "DKV" },
  { key: "AKL", label: "AKL" },
  { key: "PM", label: "PM" },
  { key: "SMP", label: "SMP" },
  { key: "YAYASAN", label: "Yayasan" },
  { key: "BC", label: "Bisnis Center" },
  { key: "PPDB", label: "PPDB" },
  { key: "KEUANGAN", label: "Keuangan" },
  { key: "HRGA", label: "HR / GA / Umum" },
] as const

export const KATEGORI_DEVICE = [
  // IT
  { key: "PC", label: "PC / Desktop (Unit Lengkap)", prefix: "PC", type: "IT" },
  { key: "CPU", label: "CPU / Unit Prosesor", prefix: "CPU", type: "IT" },
  { key: "MON", label: "Monitor", prefix: "MON", type: "IT" },
  { key: "LAP", label: "Laptop", prefix: "LAP", type: "IT" },
  { key: "KEY", label: "Keyboard", prefix: "KEY", type: "IT" },
  { key: "MOU", label: "Mouse", prefix: "MOU", type: "IT" },
  { key: "PRN", label: "Printer", prefix: "PRN", type: "IT" },
  { key: "PROJ", label: "Proyektor / LCD", prefix: "PROJ", type: "IT" },
  { key: "UPS", label: "UPS / Stabilizer", prefix: "UPS", type: "IT" },
  { key: "RTR", label: "Router / Perangkat Jaringan", prefix: "RTR", type: "IT" },
  { key: "LAIN", label: "Elektronik IT Lainnya", prefix: "LAIN", type: "IT" },

  // Non-IT (HR/GA)
  { key: "MEJA", label: "Meja Kerja / Siswa", prefix: "MJA", type: "NON_IT" },
  { key: "KURSI", label: "Kursi Kerja / Siswa", prefix: "KRS", type: "NON_IT" },
  { key: "AC", label: "AC / Pendingin Ruangan", prefix: "AC", type: "NON_IT" },
  { key: "LEMARI", label: "Lemari / Loker Arsip", prefix: "LMR", type: "NON_IT" },
  { key: "PAPAN", label: "Papan Tulis / Whiteboard", prefix: "PPN", type: "NON_IT" },
  { key: "SOUND", label: "Sound System / Speaker", prefix: "SND", type: "NON_IT" },
  { key: "ALAT", label: "Peralatan Kantor & GA", prefix: "ALT", type: "NON_IT" },
  { key: "LAIN_GA", label: "Fasilitas & Aset GA Lainnya", prefix: "GA", type: "NON_IT" },
] as const

export type KondisiStatus = "baik" | "bermasalah" | "mati"

export function kondisiStatus(kondisi: string): KondisiStatus {
  const k = (kondisi || "").toUpperCase()
  if (!k || k === "-") return "bermasalah"
  if (k === "BAIK") return "baik"
  if (k.includes("RUSAK RINGAN") || k.includes("BERMASALAH")) return "bermasalah"
  if (k.includes("RUSAK BERAT") || k.includes("MATI") || k === "RUSAK") return "mati"
  return "baik"
}

export const kondisiMeta: Record<KondisiStatus, { label: string; className: string }> = {
  baik: { label: "Baik", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  bermasalah: { label: "Rusak Ringan / Bermasalah", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  mati: { label: "Rusak Berat / Mati", className: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
}

export function getStats(items: InventoryItem[]) {
  const total = items.length
  const baik = items.filter((i) => kondisiStatus(i.kondisi) === "baik").length
  const bermasalah = items.filter((i) => kondisiStatus(i.kondisi) === "bermasalah").length
  const mati = items.filter((i) => kondisiStatus(i.kondisi) === "mati").length
  return { total, baik, bermasalah, mati }
}

const LOCAL_STORAGE_KEY = "qr_inventory_items_v2"

export function getStoredInventory(): InventoryItem[] {
  if (typeof window === "undefined") return inventory
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error("Failed to load inventory from localStorage", e)
  }
  return inventory
}

export function saveStoredInventory(items: InventoryItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event("inventory_updated"))
  } catch (e) {
    console.error("Failed to save inventory to localStorage", e)
  }
}

export function getCategoryFromItem(item: InventoryItem): string {
  if (item.kategori) return item.kategori
  const parts = item.kode.split("-")
  if (parts.length >= 2) {
    const codePart = parts[1].toUpperCase()
    const found = KATEGORI_DEVICE.find((k) => k.prefix === codePart)
    if (found) return found.key
  }
  return "PC"
}

export function derivePrefixFromRoomOrUnit(unitOrRoom: string): string {
  const s = (unitOrRoom || "").trim().toUpperCase()
  if (!s) return "TJKT"

  if (s.includes("YAYASAN") || s.includes("YYS")) return "YYS"
  if (s.includes("KEUANGAN")) return "KEUANGAN"
  if (s.includes("BISNIS") || s.includes("BC")) return "BC"
  if (s.includes("PPDB")) return "PPDB"
  if (s.includes("SERVER")) return "SERVER"
  if (s.includes("GUDANG") || s.includes("INVENTARIS")) return "GUDANG"
  if (s.includes("KEPSEK") || s.includes("KEPALA SEKOLAH")) return "KEPSEK"
  if (s.includes("GURU")) return "GURU"
  if (s.includes("HR") || s.includes("GA")) return "GA"
  if (s.includes("TJKT")) return "TJKT"
  if (s.includes("DKV")) return "DKV"
  if (s.includes("MPLB")) return "MPLB"
  if (s.includes("AKL")) return "AKL"
  if (s.includes("PM")) return "PM"
  if (s.includes("SMP")) return "SMP"

  const cleanWords = s.replace(/RUANG|LAB|RUANGAN/gi, "").trim().split(/\s+/)
  if (cleanWords.length > 0 && cleanWords[0]) {
    const firstWord = cleanWords[0].replace(/[^A-Z0-9]/gi, "").toUpperCase()
    if (firstWord.length >= 2) return firstWord
  }

  return "UNIT"
}

export function generateNextCode(
  unitOrRoom: string,
  kategoriPrefix: string = "PC",
  items: InventoryItem[],
  itemType: ItemType = "IT"
): string {
  const prefixUnit = itemType === "NON_IT" ? "GA" : derivePrefixFromRoomOrUnit(unitOrRoom)
  const prefixKat = (kategoriPrefix || "BARANG").toUpperCase()

  const regex = new RegExp(`^${prefixUnit}-${prefixKat}-(\\d+)`, "i")
  let maxNum = 0

  items.forEach((item) => {
    const match = item.kode.match(regex)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  })

  const nextNum = String(maxNum + 1).padStart(3, "0")
  const yearSuffix = new Date().getFullYear().toString().slice(-2)

  if (itemType === "NON_IT") {
    return `GA-${prefixKat}-${nextNum}-${yearSuffix}`
  }
  return `${prefixUnit}-${prefixKat}-${nextNum}-${yearSuffix}`
}
