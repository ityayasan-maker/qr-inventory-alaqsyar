import * as XLSX from "xlsx"
import { generateNextCode, getCategoryFromItem, getItemType, type InventoryItem } from "@/lib/inventory"

const EXCEL_COLUMNS = [
  "Jenis Barang",
  "Kategori",
  "Jurusan / Unit",
  "Kode Inventaris",
  "Nama Barang / Device",
  "Merek / Model",
  "Spesifikasi / Prosesor",
  "RAM",
  "Storage",
  "Sistem Operasi / Firmware",
  "Bahan / Warna",
  "Tanggal Perolehan",
  "Harga Perolehan",
  "Penanggung Jawab",
  "Serial Number / Motherboard",
  "Kondisi",
  "Lokasi",
  "Catatan",
] as const

export function exportToExcel(items: InventoryItem[], filename = "Inventaris-Barang-Al-Aqsyar.xlsx") {
  const dataRows = items.map((i) => {
    const type = getItemType(i)
    return {
      "Jenis Barang": type === "NON_IT" ? "Non-IT (HR/GA)" : "IT",
      "Kategori": getCategoryFromItem(i),
      "Jurusan / Unit": i.jurusan || "-",
      "Kode Inventaris": i.kode || "-",
      "Nama Barang / Device": i.namaPc || "-",
      "Merek / Model": i.merekModel || "-",
      "Spesifikasi / Prosesor": i.prosesor || "-",
      "RAM": i.ram || "-",
      "Storage": i.storage || "-",
      "Sistem Operasi / Firmware": i.os || "-",
      "Bahan / Warna": i.bahanWarna || "-",
      "Tanggal Perolehan": i.tanggalPerolehan || "-",
      "Harga Perolehan": i.hargaPerolehan || "-",
      "Penanggung Jawab": i.penanggungJawab || "-",
      "Serial Number / Motherboard": i.motherboard || "-",
      "Kondisi": i.kondisi || "Baik",
      "Lokasi": i.lokasi || "-",
      "Catatan": i.catatan || "-",
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(dataRows, { header: [...EXCEL_COLUMNS] })
  
  const colWidths = EXCEL_COLUMNS.map((col) => {
    if (col === "Kode Inventaris" || col === "Kategori") return { wch: 18 }
    if (col === "Nama Barang / Device" || col === "Merek / Model" || col === "Spesifikasi / Prosesor") return { wch: 25 }
    if (col === "Lokasi" || col === "Catatan" || col === "Penanggung Jawab") return { wch: 25 }
    return { wch: 15 }
  })
  worksheet["!cols"] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inventaris")
  XLSX.writeFile(workbook, filename)
}

export function downloadTemplateExcel() {
  const sampleRows = [
    {
      "Jenis Barang": "IT",
      "Kategori": "PC",
      "Jurusan / Unit": "TJKT",
      "Kode Inventaris": "TJKT-PC-001-26",
      "Nama Barang / Device": "LAB-TJKT-01",
      "Merek / Model": "PC Desktop Custom",
      "Spesifikasi / Prosesor": "Core i5-2400",
      "RAM": "8 GB",
      "Storage": "128 GB SSD",
      "Sistem Operasi / Firmware": "Windows 10 Pro",
      "Bahan / Warna": "-",
      "Tanggal Perolehan": "2024-01-15",
      "Harga Perolehan": "Rp 3.500.000",
      "Penanggung Jawab": "Koor Lab TJKT",
      "Serial Number / Motherboard": "H61 Motherboard",
      "Kondisi": "Baik",
      "Lokasi": "Lab TJKT",
      "Catatan": "Kondisi fisik mulus, siap pakai",
    },
    {
      "Jenis Barang": "Non-IT (HR/GA)",
      "Kategori": "MEJA",
      "Jurusan / Unit": "HRGA",
      "Kode Inventaris": "GA-MJA-001-26",
      "Nama Barang / Device": "Meja Kerja Kayu Jati",
      "Merek / Model": "Olympic Executive Desk",
      "Spesifikasi / Prosesor": "-",
      "RAM": "-",
      "Storage": "-",
      "Sistem Operasi / Firmware": "-",
      "Bahan / Warna": "Kayu Cokelat Tua",
      "Tanggal Perolehan": "2024-03-10",
      "Harga Perolehan": "Rp 2.200.000",
      "Penanggung Jawab": "Pak Budi (HR/GA)",
      "Serial Number / Motherboard": "-",
      "Kondisi": "Baik",
      "Lokasi": "Ruang HR / GA",
      "Catatan": "Meja kerja staf HR",
    },
    {
      "Jenis Barang": "Non-IT (HR/GA)",
      "Kategori": "AC",
      "Jurusan / Unit": "YAYASAN",
      "Kode Inventaris": "GA-AC-001-26",
      "Nama Barang / Device": "AC Split 1.5 PK",
      "Merek / Model": "Daikin Inverter FTKM35",
      "Spesifikasi / Prosesor": "-",
      "RAM": "-",
      "Storage": "-",
      "Sistem Operasi / Firmware": "-",
      "Bahan / Warna": "Plastik Putih",
      "Tanggal Perolehan": "2024-02-01",
      "Harga Perolehan": "Rp 5.800.000",
      "Penanggung Jawab": "Pak Dede (Maintenance)",
      "Serial Number / Motherboard": "SN: DK-9182419",
      "Kondisi": "Baik",
      "Lokasi": "Ruang Yayasan",
      "Catatan": "Service rutin tiap 3 bulan",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: [...EXCEL_COLUMNS] })
  worksheet["!cols"] = EXCEL_COLUMNS.map(() => ({ wch: 22 }))

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

    const jenisRaw = getValue(["Jenis Barang", "Jenis", "jenis", "Type", "type"])
    const jurusan = getValue(["Jurusan / Unit", "Jurusan", "jurusan", "Unit", "unit"]) || "TJKT"
    const kategori = getValue(["Kategori", "kategori", "KATEGORI", "Jenis", "jenis"]) || "PC"
    let kode = getValue(["Kode Inventaris", "Kode Aset", "kode", "Kode", "KODE ASET", "KODE"])

    const isNonIT = jenisRaw.toLowerCase().includes("non") || kategori.toUpperCase() === "MEJA" || kategori.toUpperCase() === "KURSI" || kategori.toUpperCase() === "AC"

    if (!kode) {
      kode = generateNextCode(jurusan, kategori, [...currentTotalList, ...items], isNonIT ? "NON_IT" : "IT")
    }

    const item: InventoryItem = {
      type: isNonIT ? "NON_IT" : "IT",
      jurusan: jurusan.toUpperCase(),
      no: String(index + 1),
      kode: kode,
      kategori: kategori.toUpperCase(),
      namaPc: getValue(["Nama Barang / Device", "Nama PC", "namaPc", "NAMA PC", "Nama", "nama"]),
      merekModel: getValue(["Merek / Model", "Merek", "merek", "Model", "model"]),
      prosesor: getValue(["Spesifikasi / Prosesor", "Prosesor", "prosesor", "PROSESOR", "Processor"]),
      ram: getValue(["RAM", "ram", "Ram"]),
      storage: getValue(["Storage", "storage", "Penyimpanan", "STORAGE"]),
      os: getValue(["Sistem Operasi / Firmware", "Sistem Operasi", "os", "OS", "Operating System"]),
      bahanWarna: getValue(["Bahan / Warna", "Bahan", "Warna"]),
      tanggalPerolehan: getValue(["Tanggal Perolehan", "Tanggal", "Tgl Perolehan"]),
      hargaPerolehan: getValue(["Harga Perolehan", "Harga", "Harga Beli"]),
      penanggungJawab: getValue(["Penanggung Jawab", "PJ", "Penanggungjawab"]),
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
