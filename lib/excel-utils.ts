import * as XLSX from "xlsx"
import { generateNextCode, type InventoryItem } from "@/lib/inventory"

const EXCEL_COLUMNS = [
  "Jurusan",
  "Kode Aset",
  "Nama PC",
  "Prosesor",
  "RAM",
  "Storage",
  "Sistem Operasi",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Merek Casing",
  "Motherboard",
  "Kondisi",
  "Lokasi",
  "Catatan",
] as const

export function exportToExcel(items: InventoryItem[], filename = "Inventaris-Komputer-Al-Aqsyar.xlsx") {
  const dataRows = items.map((i) => ({
    "Jurusan": i.jurusan || "-",
    "Kode Aset": i.kode || "-",
    "Nama PC": i.namaPc || "-",
    "Prosesor": i.prosesor || "-",
    "RAM": i.ram || "-",
    "Storage": i.storage || "-",
    "Sistem Operasi": i.os || "-",
    "Monitor": i.monitor || "-",
    "Keyboard": i.keyboard || "-",
    "Mouse": i.mouse || "-",
    "Merek Casing": i.casing || "-",
    "Motherboard": i.motherboard || "-",
    "Kondisi": i.kondisi || "Baik",
    "Lokasi": i.lokasi || "-",
    "Catatan": i.catatan || "-",
  }))

  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: [...EXCEL_COLUMNS] })
  
  // Set column widths
  const colWidths = EXCEL_COLUMNS.map((col) => {
    if (col === "Kode Aset") return { wch: 18 }
    if (col === "Nama PC" || col === "Prosesor") return { wch: 22 }
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
      "Jurusan": "TJKT",
      "Kode Aset": "TJKT-PC-001-26",
      "Nama PC": "LAB-TJKT-01",
      "Prosesor": "Core i5-2400",
      "RAM": "8 GB",
      "Storage": "128 GB SSD",
      "Sistem Operasi": "Windows 10 Pro",
      "Monitor": "SAMSUNG 19 INCH",
      "Keyboard": "Standard USB",
      "Mouse": "Standard USB",
      "Merek Casing": "Standard ATX",
      "Motherboard": "H61 Motherboard",
      "Kondisi": "Baik",
      "Lokasi": "Lab TJKT",
      "Catatan": "Kondisi fisik mulus, siap pakai",
    },
    {
      "Jurusan": "Yayasan",
      "Kode Aset": "YAYASAN-PC-001-26",
      "Nama PC": "STAFF-YAYASAN-01",
      "Prosesor": "Core i3-3220",
      "RAM": "4 GB",
      "Storage": "256 GB SSD",
      "Sistem Operasi": "Windows 10 Pro",
      "Monitor": "LG 19 INCH",
      "Keyboard": "Standard USB",
      "Mouse": "Standard USB",
      "Merek Casing": "Standard ATX",
      "Motherboard": "H61 Motherboard",
      "Kondisi": "Baik",
      "Lokasi": "Ruang Yayasan",
      "Catatan": "Unit komputer kantor yayasan",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: [...EXCEL_COLUMNS] })
  worksheet["!cols"] = EXCEL_COLUMNS.map(() => ({ wch: 18 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Impor")
  XLSX.writeFile(workbook, "Template-Impor-Inventaris-Al-Aqsyar.xlsx")
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
    // Flexible header mapping
    const getValue = (keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim()
        }
      }
      return ""
    }

    const jurusan = getValue(["Jurusan", "jurusan", "JURUSAN", "Unit", "unit"]) || "TJKT"
    let kode = getValue(["Kode Aset", "kode", "Kode", "KODE ASET", "KODE"])
    
    if (!kode) {
      kode = generateNextCode(jurusan, [...currentTotalList, ...items])
    }

    const item: InventoryItem = {
      jurusan: jurusan.toUpperCase(),
      no: String(index + 1),
      kode: kode,
      namaPc: getValue(["Nama PC", "namaPc", "NAMA PC", "Nama", "nama"]),
      prosesor: getValue(["Prosesor", "prosesor", "PROSESOR", "Processor", "processor"]),
      ram: getValue(["RAM", "ram", "Ram"]),
      storage: getValue(["Storage", "storage", "Penyimpanan", "STORAGE"]),
      os: getValue(["Sistem Operasi", "os", "OS", "Operating System"]),
      monitor: getValue(["Monitor", "monitor", "MONITOR"]),
      keyboard: getValue(["Keyboard", "keyboard"]),
      mouse: getValue(["Mouse", "mouse"]),
      casing: getValue(["Merek Casing", "casing", "Casing", "CASING"]),
      motherboard: getValue(["Motherboard", "motherboard", "MOTHERBOARD"]),
      kondisi: getValue(["Kondisi", "kondisi", "KONDISI", "Status", "status"]) || "Baik",
      lokasi: getValue(["Lokasi", "lokasi", "Ruangan", "ruangan"]) || `Lab ${jurusan}`,
      catatan: getValue(["Catatan", "catatan", "Keterangan", "keterangan"]),
    }

    items.push(item)
  })

  return items
}
