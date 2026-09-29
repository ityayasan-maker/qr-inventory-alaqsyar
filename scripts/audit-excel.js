const XLSX = require("xlsx")
const fs = require("fs")
const path = require("path")

const excelPath = "C:\\Users\\ariel\\Downloads\\Inventaris Komputer Al-Aqsyar (2).xlsx"
const jsonPath = path.join(process.cwd(), "lib", "inventory.json")

const wb = XLSX.readFile(excelPath)
const currentJson = JSON.parse(fs.readFileSync(jsonPath, "utf8"))

console.log("=== EXCEL AUDIT REPORT ===")
console.log("Sheet names in Excel:", wb.SheetNames)

const sheetsToProcess = ["TJKT", "MPLB", "DKV", "AKL", "PM", "SMP", "PC YYS"]
const allExcelItems = []

sheetsToProcess.forEach((sheetName) => {
  const sheet = wb.Sheets[sheetName]
  if (!sheet) return
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
  if (rows.length < 2) return

  let headerIdx = 0
  for (let i = 0; i < Math.min(10, rows.length); i++) {
    const rowStr = JSON.stringify(rows[i] || []).toUpperCase()
    if (rowStr.includes("KODE ASET") || rowStr.includes("KODE")) {
      headerIdx = i
      break
    }
  }

  const headers = rows[headerIdx].map((h) => String(h || "").trim())
  const dataRows = rows.slice(headerIdx + 1)

  const kodeIdx = headers.findIndex((h) => h.toUpperCase().includes("KODE"))
  const namaPcIdx = headers.findIndex((h) => h.toUpperCase().includes("NAMA PC"))
  const procIdx = headers.findIndex((h) => h.toUpperCase().includes("PROSESOR"))
  const ramIdx = headers.findIndex((h) => h.toUpperCase().includes("RAM"))
  const storageIdx = headers.findIndex((h) => h.toUpperCase().includes("STORAGE"))
  const osIdx = headers.findIndex((h) => h.toUpperCase().includes("OS"))
  const kbIdx = headers.findIndex((h) => h.toUpperCase().includes("KEYBOARD"))
  const mouseIdx = headers.findIndex((h) => h.toUpperCase().includes("MOUSE"))
  const monIdx = headers.findIndex((h) => h.toUpperCase().includes("MONITOR"))
  const casingIdx = headers.findIndex((h) => h.toUpperCase().includes("CASING"))
  const kondisiIdx = headers.findIndex((h) => h.toUpperCase().includes("KONDISI"))
  const mbIdx = headers.findIndex((h) => h.toUpperCase().includes("MOTHERBOARD"))
  const lokasiIdx = headers.findIndex((h) => h.toUpperCase().includes("LOKASI"))
  const catIdx = headers.findIndex((h) => h.toUpperCase().includes("CATATAN"))
  const merekIdx = headers.findIndex((h) => h.toUpperCase().includes("MEREK"))
  const tipeIdx = headers.findIndex((h) => h.toUpperCase().includes("TIPE"))

  let count = 0
  dataRows.forEach((r, idx) => {
    if (!r || r.length === 0) return
    const kode = String(r[kodeIdx] || "").trim()
    if (!kode || kode === "-" || kode.toUpperCase() === "NO" || kode.toUpperCase().includes("KODE")) return

    let jurusan = sheetName === "PC YYS" ? "Yayasan" : sheetName
    let rawNamaPc = String(r[namaPcIdx] || "").trim()
    const merek = merekIdx >= 0 ? String(r[merekIdx] || "").trim() : ""
    const tipe = tipeIdx >= 0 ? String(r[tipeIdx] || "").trim() : ""

    let namaPc = rawNamaPc
    if (merek && merek !== "-" && tipe && tipe !== "-") {
      namaPc = `${merek} ${tipe} (${rawNamaPc})`
    } else if (merek && merek !== "-") {
      namaPc = `${merek} - ${rawNamaPc}`
    }

    const item = {
      jurusan: jurusan,
      no: String(idx + 1),
      kode: kode,
      namaPc: namaPc,
      prosesor: String(r[procIdx] || "").trim(),
      ram: String(r[ramIdx] || "").trim(),
      storage: String(r[storageIdx] || "").trim(),
      os: String(r[osIdx] || "").trim(),
      keyboard: String(r[kbIdx] || "").trim(),
      mouse: String(r[mouseIdx] || "").trim(),
      monitor: String(r[monIdx] || "").trim(),
      casing: casingIdx >= 0 ? String(r[casingIdx] || "").trim() : "",
      kondisi: String(r[kondisiIdx] || "").trim() || "Baik",
      motherboard: String(r[mbIdx] || "").trim(),
      lokasi: lokasiIdx >= 0 && String(r[lokasiIdx] || "").trim() ? String(r[lokasiIdx] || "").trim() : (jurusan === "Yayasan" ? "Kantor Yayasan" : `Lab ${jurusan}`),
      catatan: catIdx >= 0 ? String(r[catIdx] || "").trim() : "",
    }
    allExcelItems.push(item)
    count++
  })
  console.log(`Sheet "${sheetName}": ${count} valid unit items extracted`)
})

console.log("\nTotal items in Excel file:", allExcelItems.length)
console.log("Total items currently in JSON:", currentJson.length)

// Check for missing items in current json vs excel
const currentMap = new Map()
currentJson.forEach((i) => currentMap.set(i.kode, i))

const excelMap = new Map()
allExcelItems.forEach((i) => excelMap.set(i.kode, i))

const missingInJson = allExcelItems.filter((i) => !currentMap.has(i.kode))
console.log(`\nItems in Excel but MISSING in current JSON (${missingInJson.length}):`)
missingInJson.forEach((i) => console.log(`  - [${i.jurusan}] ${i.kode}: ${i.namaPc} (${i.prosesor})`))
