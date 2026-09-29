import * as XLSX from "xlsx"
import { generateNextCode, getCategoryFromItem, type InventoryItem } from "@/lib/inventory"

const EXCEL_COLUMNS = [
  "Kategori",
  "Jurusan",
  "Kode Aset",
  "Nama Device / Merek",
  "Spesifikasi / Prosesor",
  "RAM",
  "Storage",
  "Sistem Operasi",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Merek Casing",
  "Serial Number / Motherboard",
  "Kondisi",
  "Lokasi",
  "Catatan",
] as const

export function exportToExcel(items: InventoryItem[], filename = "Inventaris-Barang-IT-Al-Aqsyar.xlsx") {
  const dataRows = items.map((i) => ({
    "Kategori": getCategoryFromItem(i),
    "Jurusan": i.jurusan || "-",
    "Kode Aset": i.kode || "-",
    "Nama Device / Merek": i.namaPc || "-",
    "Spesifikasi / Prosesor": i.prosesor || "-",
    "RAM": i.ram || "-",
    "Storage": i.storage || "-",
    "Sistem Operasi": i.os || "-",
    "Monitor": i.monitor || "-",
    "Keyboard": i.keyboard || "-",
    "Mouse": i.mouse || "-",
    "Merek Casing": i.casing || "-",
    "Serial Number / Motherboard": i.motherboard || "-",
    "Kondisi": i.kondisi || "Baik",
    "Lokasi": i.lokasi || "-",
    "Catatan": i.catatan || "-",
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: [...EXCEL_COLUMNS] })
  
  const colWidths = EXCEL_COLUMNS.map((col) => {
    if (col === "Kode Aset" || col === "Kategori") return { wch: 16 }
    if (col === "Nama Device / Merek" || col === "Spesifikasi / Prosesor") return { wch: 25 }
    if (col === "Lokasi" || col === "Catatan") return { wch: 25 }
    return { wch: 14 }
  })
  worksheet["!cols"] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inventaris")
  XLSX.writeFile(workbook, filename)
}

export function downloadTemplateExcel() {
  const sampleRows = [
    {
      "Kategori": "PC",
      "Jurusan": "TJKT",
      "Kode Aset": "TJKT-PC-001-26",
      "Nama Device / Merek": "LAB-TJKT-01",
      "Spesifikasi / Prosesor": "Core i5-2400",
      "RAM": "8 GB",
      "Storage": "128 GB SSD",
      "Sistem Operasi": "Windows 10 Pro",
      "Monitor": "SAMSUNG 19 INCH",
      "Keyboard": "Standard USB",
      "Mouse": "Standard USB",
      "Merek Casing": "Standard ATX",
      "Serial Number / Motherboard": "H61 Motherboard",
      "Kondisi": "Baik",
      "Lokasi": "Lab TJKT",
      "Catatan": "Kondisi fisik mulus, siap pakai",
    },
    {
      "Kategori": "LAP",
      "Jurusan": "Yayasan",
      "Kode Aset": "YAYASAN-LAP-001-26",
      "Nama Device / Merek": "Asus Vivobook 14",
      "Spesifikasi / Prosesor": "Intel Core i5-1135G7",
      "RAM": "16 GB",
      "Storage": "512 GB SSD",
      "Sistem Operasi": "Windows 11 Home",
      "Monitor": "Layar 14 Inch FHD",
      "Keyboard": "Integrated",
      "Mouse": "Wireless Mouse",
      "Merek Casing": "- ",
      "Serial Number / Motherboard": "SN: K9N0CV1249124",
      "Kondisi": "Baik",
      "Lokasi": "Ruang Yayasan",
      "Catatan": "Laptop inventaris kepala yayasan",
    },
    {
      "Kategori": "PRN",
      "Jurusan": "KEUANGAN",
      "Kode Aset": "KEUANGAN-PRN-001-26",
      "Nama Device / Merek": "Epson EcoTank L3210",
      "Spesifikasi / Prosesor": "All-in-One InkTank Printer",
      "RAM": "-",
      "Storage": "-",
      "Sistem Operasi": "-",
      "Monitor": "-",
      "Keyboard": "-",
      "Mouse": "-",
      "Merek Casing": "-",
      "Serial Number / Motherboard": "SN: X92K819241",
      "Kondisi": "Baik",
      "Lokasi": "Ruang Keuangan",
      "Catatan": "Printer cetak kuitansi & nota",
    },
    {
      "Kategori": "PROJ",
      "Jurusan": "MPLB",
      "Kode Aset": "MPLB-PROJ-001-26",
      "Nama Device / Merek": "Epson EB-X500 Projector",
      "Spesifikasi / Prosesor": "3600 Lumens XGA 3LCD",
      "RAM": "-",
      "Storage": "-",
      "Sistem Operasi": "-",
      "Monitor": "-",
      "Keyboard": "-",
      "Mouse": "-",
      "Merek Casing": "-",
      "Serial Number / Motherboard": "SN: PROJ-918241",
      "Kondisi": "Baik",
      "Lokasi": "Ruang Kelas MPLB",
      "Catatan": "Lengkap dengan remote & kabel HDMI 10m",
    },
    {
      "Kategori": "RTR",
      "Jurusan": "TJKT",
      "Kode Aset": "TJKT-RTR-001-26",
      "Nama Device / Merek": "MikroTik RB951Ui-2HnD",
      "Spesifikasi / Prosesor": "600MHz CPU / 128MB RAM",
      "RAM": "128 MB",
      "Storage": "64 MB Flash",
      "Sistem Operasi": "RouterOS v7",
      "Monitor": "-",
      "Keyboard": "-",
      "Mouse": "-",
      "Merek Casing": "Plastic Case",
      "Serial Number / Motherboard": "SN: RB951-819241",
      "Kondisi": "Baik",
      "Lokasi": "Lab TJKT",
      "Catatan": "Router utama lab jaringan",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: [...EXCEL_COLUMNS] })
  worksheet["!cols"] = EXCEL_COLUMNS.map(() => ({ wch: 20 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Impor")
  XLSX.writeFile(workbook, "Template-Impor-Inventaris-Barang-Al-Aqsyar.xlsx")
}

export async function parseExcelFile(file: File, existingItems: InventoryItem[]): Promise<InventoryItem[]> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[firstSheetName]
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet)

  const items: InventoryItem[] = []
  const currentTotalList = [...existingItems]

  rawData.forEach((row, index) => {
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim()
        }
      }
      return ""
    }

    const jurusan = getValue(["Jurusan", "jurusan", "JURUSAN", "Unit", "unit"]) || "TJKT"
    const kategori = getValue(["Kategori", "kategori", "KATEGORI", "Jenis", "jenis"]) || "PC"
    let kode = getValue(["Kode Aset", "kode", "Kode", "KODE ASET", "KODE"])

    if (!kode) {
      kode = generateNextCode(jurusan, kategori, [...currentTotalList, ...items])
    }

    const item: InventoryItem = {
      jurusan: jurusan.toUpperCase(),
      no: String(index + 1),
      kode: kode,
      kategori: kategori.toUpperCase(),
      namaPc: getValue(["Nama Device / Merek", "Nama PC", "namaPc", "NAMA PC", "Nama", "nama"]),
      prosesor: getValue(["Spesifikasi / Prosesor", "Prosesor", "prosesor", "PROSESOR", "Processor"]),
      ram: getValue(["RAM", "ram", "Ram"]),
      storage: getValue(["Storage", "storage", "Penyimpanan", "STORAGE"]),
      os: getValue(["Sistem Operasi", "os", "OS", "Operating System"]),
      monitor: getValue(["Monitor", "monitor", "MONITOR"]),
      keyboard: getValue(["Keyboard", "keyboard"]),
      mouse: getValue(["Mouse", "mouse"]),
      casing: getValue(["Merek Casing", "casing", "Casing", "CASING"]),
      motherboard: getValue(["Serial Number / Motherboard", "Motherboard", "motherboard", "SN"]),
      kondisi: getValue(["Kondisi", "kondisi", "KONDISI", "Status", "status"]) || "Baik",
      lokasi: getValue(["Lokasi", "lokasi", "Ruangan", "ruangan"]) || `Lab ${jurusan}`,
      catatan: getValue(["Catatan", "catatan", "Keterangan", "keterangan"]),
    }

    items.push(item)
  })

  return items
}
