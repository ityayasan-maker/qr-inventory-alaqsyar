import * as XLSX from "xlsx"
import { generateNextCode, getCategoryFromItem, getItemType, type InventoryItem, type ItemType } from "@/lib/inventory"

const EXCEL_COLUMNS_IT = [
  "Jenis Barang",
  "Kategori",
  "Jurusan / Unit",
  "Kode Inventaris",
  "Nama Device / Merek",
  "Spesifikasi / Prosesor",
  "RAM",
  "Storage",
  "Sistem Operasi / Firmware",
  "Kelengkapan Keyboard",
  "Kelengkapan Mouse",
  "Monitor",
  "Merek Casing",
  "Serial Number / Motherboard",
  "Kondisi",
  "Lokasi",
  "Catatan",
] as const

const EXCEL_COLUMNS_NON_IT = [
  "Jenis Barang",
  "Kategori",
  "Jurusan / Unit",
  "Kode Inventaris",
  "Nama Barang",
  "Merek / Model",
  "Bahan / Warna",
  "Tanggal Perolehan",
  "Harga Perolehan",
  "Penanggung Jawab",
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
      "Kelengkapan Keyboard": i.keyboard || "-",
      "Kelengkapan Mouse": i.mouse || "-",
      "Bahan / Warna": i.bahanWarna || "-",
      "Tanggal Perolehan": i.tanggalPerolehan || "-",
      "Harga Perolehan": i.hargaPerolehan || "-",
      "Penanggung Jawab": i.penanggungJawab || "-",
      "Riwayat Perbaikan": i.repairLogs ? `${i.repairLogs.length}x` : "0x",
      "Serial Number / Motherboard": i.motherboard || "-",
      "Kondisi": i.kondisi || "Baik",
      "Lokasi": i.lokasi || "-",
      "Catatan": i.catatan || "-",
    }
  })

  const worksheet = XLSX.utils.json_to_sheet(dataRows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data Inventaris")
  XLSX.writeFile(workbook, filename)
}

export function downloadTemplateExcelIT() {
  const sampleRows = [
    {
      "Jenis Barang": "IT",
      "Kategori": "PC",
      "Jurusan / Unit": "TJKT",
      "Kode Inventaris": "TJKT-PC-001-26",
      "Nama Device / Merek": "LAB-TJKT-01",
      "Spesifikasi / Prosesor": "Core i5-2400",
      "RAM": "8 GB",
      "Storage": "128 GB SSD",
      "Sistem Operasi / Firmware": "Windows 10 Pro",
      "Kelengkapan Keyboard": "Standard USB Keyboard",
      "Kelengkapan Mouse": "Standard USB Mouse",
      "Monitor": "SAMSUNG 19 INCH",
      "Merek Casing": "Standard ATX",
      "Serial Number / Motherboard": "H61 Motherboard",
      "Kondisi": "Baik",
      "Lokasi": "Lab TJKT",
      "Catatan": "Lengkap keyboard & mouse, kondisi mulus",
    },
    {
      "Jenis Barang": "IT",
      "Kategori": "LAP",
      "Jurusan / Unit": "YAYASAN",
      "Kode Inventaris": "YAYASAN-LAP-001-26",
      "Nama Device / Merek": "Asus Vivobook 14",
      "Spesifikasi / Prosesor": "Intel Core i5-1135G7",
      "RAM": "16 GB",
      "Storage": "512 GB SSD",
      "Sistem Operasi / Firmware": "Windows 11 Home",
      "Kelengkapan Keyboard": "Integrated Keyboard",
      "Kelengkapan Mouse": "Wireless Mouse",
      "Monitor": "Layar 14 Inch FHD",
      "Merek Casing": "-",
      "Serial Number / Motherboard": "SN: K9N0CV1249124",
      "Kondisi": "Baik",
      "Lokasi": "Ruang Yayasan",
      "Catatan": "Laptop inventaris ketua yayasan",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: [...EXCEL_COLUMNS_IT] })
  worksheet["!cols"] = EXCEL_COLUMNS_IT.map(() => ({ wch: 20 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template IT")
  XLSX.writeFile(workbook, "Template-Impor-Barang-IT.xlsx")
}

export function downloadTemplateExcelNonIT() {
  const sampleRows = [
    {
      "Jenis Barang": "Non-IT (HR/GA)",
      "Kategori": "MEJA",
      "Jurusan / Unit": "HRGA",
      "Kode Inventaris": "GA-MJA-001-26",
      "Nama Barang": "Meja Kerja Kayu Jati",
      "Merek / Model": "Olympic Executive Desk",
      "Bahan / Warna": "Kayu Cokelat Tua",
      "Tanggal Perolehan": "2024-03-10",
      "Harga Perolehan": "Rp 2.200.000",
      "Penanggung Jawab": "Pak Budi (HR/GA)",
      "Kondisi": "Baik",
      "Lokasi": "Ruang HR / GA",
      "Catatan": "Meja kerja staf HR",
    },
    {
      "Jenis Barang": "Non-IT (HR/GA)",
      "Kategori": "AC",
      "Jurusan / Unit": "YAYASAN",
      "Kode Inventaris": "GA-AC-001-26",
      "Nama Barang": "AC Split 1.5 PK",
      "Merek / Model": "Daikin Inverter FTKM35",
      "Bahan / Warna": "Plastik Putih",
      "Tanggal Perolehan": "2024-02-01",
      "Harga Perolehan": "Rp 5.800.000",
      "Penanggung Jawab": "Pak Dede (Maintenance)",
      "Kondisi": "Baik",
      "Lokasi": "Ruang Yayasan",
      "Catatan": "Service rutin tiap 3 bulan",
    },
  ]

  const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: [...EXCEL_COLUMNS_NON_IT] })
  worksheet["!cols"] = EXCEL_COLUMNS_NON_IT.map(() => ({ wch: 20 }))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template Non-IT")
  XLSX.writeFile(workbook, "Template-Impor-Barang-Non-IT.xlsx")
}

export function downloadTemplateExcel() {
  downloadTemplateExcelIT()
}

export async function parseExcelFile(
  file: File,
  existingItems: InventoryItem[],
  targetType?: ItemType
): Promise<InventoryItem[]> {
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
    const kategori = getValue(["Kategori", "kategori", "KATEGORI", "Jenis", "jenis"]) || (targetType === "NON_IT" ? "MEJA" : "PC")
    let kode = getValue(["Kode Inventaris", "Kode Aset", "kode", "Kode", "KODE ASET", "KODE"])

    const isNonIT = targetType
      ? targetType === "NON_IT"
      : jenisRaw.toLowerCase().includes("non") ||
        ["MEJA", "KURSI", "AC", "LEMARI", "PAPAN", "SOUND", "ALAT", "LAIN_GA"].includes(kategori.toUpperCase())

    const finalType: ItemType = isNonIT ? "NON_IT" : "IT"

    if (!kode) {
      kode = generateNextCode(jurusan, kategori, [...currentTotalList, ...items], finalType)
    }

    const item: InventoryItem = {
      type: finalType,
      jurusan: jurusan.toUpperCase(),
      no: String(index + 1),
      kode: kode,
      kategori: kategori.toUpperCase(),
      namaPc: getValue(["Nama Barang / Device", "Nama Barang", "Nama PC", "namaPc", "NAMA PC", "Nama", "nama"]),
      merekModel: getValue(["Merek / Model", "Merek", "merek", "Model", "model"]),
      prosesor: getValue(["Spesifikasi / Prosesor", "Prosesor", "prosesor", "PROSESOR", "Processor"]),
      ram: getValue(["RAM", "ram", "Ram"]),
      storage: getValue(["Storage", "storage", "Penyimpanan", "STORAGE"]),
      os: getValue(["Sistem Operasi / Firmware", "Sistem Operasi", "os", "OS", "Operating System"]),
      keyboard: getValue(["Kelengkapan Keyboard", "Keyboard", "keyboard"]) || (finalType === "IT" ? "Standard USB" : "-"),
      mouse: getValue(["Kelengkapan Mouse", "Mouse", "mouse"]) || (finalType === "IT" ? "Standard USB" : "-"),
      bahanWarna: getValue(["Bahan / Warna", "Bahan", "Warna"]),
      tanggalPerolehan: getValue(["Tanggal Perolehan", "Tanggal", "Tgl Perolehan"]),
      hargaPerolehan: getValue(["Harga Perolehan", "Harga", "Harga Beli"]),
      penanggungJawab: getValue(["Penanggung Jawab", "PJ", "Penanggungjawab"]),
      monitor: getValue(["Monitor", "monitor", "MONITOR"]),
      casing: getValue(["Merek Casing", "casing", "Casing", "CASING"]),
      motherboard: getValue(["Serial Number / Motherboard", "Motherboard", "motherboard", "SN"]),
      kondisi: getValue(["Kondisi", "kondisi", "KONDISI", "Status", "status"]) || "Baik",
      lokasi: getValue(["Lokasi", "lokasi", "Ruangan", "ruangan"]) || (finalType === "NON_IT" ? "Ruang HR / GA" : `Lab ${jurusan}`),
      catatan: getValue(["Catatan", "catatan", "Keterangan", "keterangan"]),
    }

    items.push(item)
  })

  return items
}
