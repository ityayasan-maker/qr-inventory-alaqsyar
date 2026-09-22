import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { read, utils } from 'xlsx'

const buf = await readFile('data/Inventaris-Komputer-Al-Aqsyar-1-1b8476.xlsx')
const wb = read(buf, { cellDates: true })

const norm = (v) => (v == null ? '' : String(v).trim().replace(/\s+/g, ' '))

const items = []
for (const sheet of wb.SheetNames.filter((n) => !n.startsWith('BARCODE'))) {
  const rows = utils.sheet_to_json(wb.Sheets[sheet], { defval: null })
  for (const r of rows) {
    const kode = norm(r['KODE ASET'])
    if (!kode) continue // skip summary/empty rows
    items.push({
      jurusan: sheet,
      no: norm(r['NO']),
      kode,
      namaPc: norm(r['NAMA PC']),
      prosesor: norm(r['PROSESOR']),
      ram: norm(r['RAM']),
      storage: norm(r['STORAGE']),
      os: norm(r['OS']),
      keyboard: norm(r['KEYBOARD']),
      mouse: norm(r['MOUSE']),
      monitor: norm(r['MONITOR']),
      casing: norm(r['MEREK CASING']),
      kondisi: norm(r['KONDISI']),
      motherboard: norm(r['Motherboard']),
      lokasi: norm(r['LOKASI']),
      catatan: norm(r['CATATAN']),
    })
  }
}

await mkdir('lib', { recursive: true })
await writeFile('lib/inventory.json', JSON.stringify(items, null, 2))
console.log('Wrote', items.length, 'items to lib/inventory.json')
