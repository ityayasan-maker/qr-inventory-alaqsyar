const ROOMS_STORAGE_KEY = "qr_inventory_rooms_v1"

export const DEFAULT_ROOMS = [
  "Lab TJKT",
  "Lab DKV",
  "Lab MPLB",
  "Ruang Server",
  "Kantor Yayasan",
  "Ruang TU Yayasan",
  "Ruang Inventaris",
  "Ruang Keuangan",
  "Ruang PPDB",
  "Bisnis Center",
  "Gudang Utama",
  "Ruang Kelas SMP",
  "Ruang Kelas AKL",
  "Ruang Kelas PM",
  "Ruang Kepala Sekolah",
  "Ruang Guru",
]

export function getStoredRooms(): string[] {
  if (typeof window === "undefined") return DEFAULT_ROOMS
  try {
    const raw = localStorage.getItem(ROOMS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error("Failed to load rooms from localStorage", e)
  }
  return DEFAULT_ROOMS
}

export function saveStoredRooms(rooms: string[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(ROOMS_STORAGE_KEY, JSON.stringify(rooms))
    window.dispatchEvent(new Event("rooms_updated"))
  } catch (e) {
    console.error("Failed to save rooms to localStorage", e)
  }
}

export function addRoom(newRoomName: string): string[] {
  const clean = newRoomName.trim()
  if (!clean) return getStoredRooms()
  const current = getStoredRooms()
  const exists = current.some((r) => r.toLowerCase() === clean.toLowerCase())
  if (!exists) {
    const updated = [...current, clean]
    saveStoredRooms(updated)
    return updated
  }
  return current
}
