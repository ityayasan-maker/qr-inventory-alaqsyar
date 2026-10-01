export interface CategoryItem {
  id: string
  code: string
  name: string
  type: "IT" | "NON_IT"
  active: boolean
}

export interface UnitItem {
  id: string
  code: string
  name: string
  active: boolean
}

const CATEGORIES_KEY = "qr_inventory_categories_v1"
const UNITS_KEY = "qr_inventory_units_v1"

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  // IT Categories
  { id: "cat-pc", code: "PC", name: "PC / Desktop (Unit Lengkap)", type: "IT", active: true },
  { id: "cat-cpu", code: "CPU", name: "CPU / Unit Prosesor", type: "IT", active: true },
  { id: "cat-mon", code: "MON", name: "Monitor", type: "IT", active: true },
  { id: "cat-lap", code: "LAP", name: "Laptop", type: "IT", active: true },
  { id: "cat-key", code: "KEY", name: "Keyboard", type: "IT", active: true },
  { id: "cat-mou", code: "MOU", name: "Mouse", type: "IT", active: true },
  { id: "cat-prn", code: "PRN", name: "Printer", type: "IT", active: true },
  { id: "cat-proj", code: "PROJ", name: "Proyektor / LCD", type: "IT", active: true },
  { id: "cat-ups", code: "UPS", name: "UPS / Stabilizer", type: "IT", active: true },
  { id: "cat-rtr", code: "RTR", name: "Router / Perangkat Jaringan", type: "IT", active: true },
  { id: "cat-lain-it", code: "LAIN_IT", name: "Elektronik IT Lainnya", type: "IT", active: true },

  // Non-IT Categories (HR/GA)
  { id: "cat-meja", code: "MEJA", name: "Meja Kerja / Siswa", type: "NON_IT", active: true },
  { id: "cat-kursi", code: "KURSI", name: "Kursi Kerja / Siswa", type: "NON_IT", active: true },
  { id: "cat-ac", code: "AC", name: "AC / Pendingin Ruangan", type: "NON_IT", active: true },
  { id: "cat-lemari", code: "LEMARI", name: "Lemari / Loker Arsip", type: "NON_IT", active: true },
  { id: "cat-papan", code: "PAPAN", name: "Papan Tulis / Whiteboard", type: "NON_IT", active: true },
  { id: "cat-sound", code: "SOUND", name: "Sound System / Speaker", type: "NON_IT", active: true },
  { id: "cat-alat", code: "ALAT", name: "Peralatan Kantor & Kebersihan", type: "NON_IT", active: true },
  { id: "cat-lain-non-it", code: "LAIN_GA", name: "Fasilitas & Aset GA Lainnya", type: "NON_IT", active: true },
]

export const DEFAULT_UNITS: UnitItem[] = [
  { id: "unit-tjkt", code: "TJKT", name: "TJKT", active: true },
  { id: "unit-mplb", code: "MPLB", name: "MPLB", active: true },
  { id: "unit-dkv", code: "DKV", name: "DKV", active: true },
  { id: "unit-akl", code: "AKL", name: "AKL", active: true },
  { id: "unit-pm", code: "PM", name: "PM", active: true },
  { id: "unit-smp", code: "SMP", name: "SMP", active: true },
  { id: "unit-yys", code: "YAYASAN", name: "Yayasan", active: true },
  { id: "unit-bc", code: "BC", name: "Bisnis Center", active: true },
  { id: "unit-ppdb", code: "PPDB", name: "PPDB", active: true },
  { id: "unit-keuangan", code: "KEUANGAN", name: "Keuangan", active: true },
  { id: "unit-hrga", code: "HRGA", name: "HR / GA / Umum", active: true },
]

export function getStoredCategories(): CategoryItem[] {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error("Failed to load categories from localStorage", e)
  }
  return DEFAULT_CATEGORIES
}

export function saveStoredCategories(categories: CategoryItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    window.dispatchEvent(new Event("master_data_updated"))
  } catch (e) {
    console.error("Failed to save categories to localStorage", e)
  }
}

export function getStoredUnits(): UnitItem[] {
  if (typeof window === "undefined") return DEFAULT_UNITS
  try {
    const raw = localStorage.getItem(UNITS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error("Failed to load units from localStorage", e)
  }
  return DEFAULT_UNITS
}

export function saveStoredUnits(units: UnitItem[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(UNITS_KEY, JSON.stringify(units))
    window.dispatchEvent(new Event("master_data_updated"))
  } catch (e) {
    console.error("Failed to save units to localStorage", e)
  }
}
