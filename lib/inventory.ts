import raw from "./inventory.json"

export type InventoryItem = {
  jurusan: string
  no: string
  kode: string
  namaPc: string
  prosesor: string
  ram: string
  storage: string
  os: string
  keyboard: string
  mouse: string
  monitor: string
  casing: string
  kondisi: string
  motherboard: string
  lokasi: string
  catatan: string
}

export const inventory: InventoryItem[] = raw as InventoryItem[]

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
] as const

export type KondisiStatus = "baik" | "bermasalah" | "mati"

export function kondisiStatus(kondisi: string): KondisiStatus {
  const k = (kondisi || "").toUpperCase()
  if (!k || k === "-") return "bermasalah"
  if (k === "BAIK") return "baik"
  if (k.includes("MATI") && !k.includes("MONITOR")) return "mati"
  if (k === "RUSAK") return "mati"
  return "bermasalah"
}

export const kondisiMeta: Record<KondisiStatus, { label: string; className: string }> = {
  baik: { label: "Baik", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  bermasalah: { label: "Bermasalah", className: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  mati: { label: "Mati / Rusak", className: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
}

export function getStats(items: InventoryItem[]) {
  const total = items.length
  const baik = items.filter((i) => kondisiStatus(i.kondisi) === "baik").length
  const bermasalah = items.filter((i) => kondisiStatus(i.kondisi) === "bermasalah").length
  const mati = items.filter((i) => kondisiStatus(i.kondisi) === "mati").length
  return { total, baik, bermasalah, mati }
}

const LOCAL_STORAGE_KEY = "qr_inventory_items_v1"

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

export function generateNextCode(jurusan: string, items: InventoryItem[]): string {
  const prefix = jurusan.toUpperCase()
  const sameJurusan = items.filter((i) => i.jurusan.toUpperCase() === prefix)
  let maxNum = 0
  sameJurusan.forEach((item) => {
    const match = item.kode.match(/-(\d+)-/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  })
  const nextNum = String(maxNum + 1).padStart(3, "0")
  const yearSuffix = new Date().getFullYear().toString().slice(-2)
  return `${prefix}-PC-${nextNum}-${yearSuffix}`
}
