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
] as const

export type KondisiStatus = "baik" | "bermasalah" | "mati"

export function kondisiStatus(kondisi: string): KondisiStatus {
  const k = kondisi.toUpperCase()
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
