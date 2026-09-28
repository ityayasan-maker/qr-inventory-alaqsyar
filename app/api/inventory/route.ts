import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import rawInventory from "@/lib/inventory.json"
import type { InventoryItem } from "@/lib/inventory"

const jsonFilePath = path.join(process.cwd(), "lib", "inventory.json")

function readJsonFile(): InventoryItem[] {
  try {
    if (fs.existsSync(jsonFilePath)) {
      const data = fs.readFileSync(jsonFilePath, "utf8")
      return JSON.parse(data)
    }
  } catch (err) {
    console.error("Error reading inventory.json:", err)
  }
  return rawInventory as InventoryItem[]
}

function writeJsonFile(data: InventoryItem[]) {
  try {
    fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), "utf8")
  } catch (err) {
    console.error("Error writing to inventory.json:", err)
  }
}

export async function GET() {
  const data = readJsonFile()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const newItem: InventoryItem = await request.json()
    if (!newItem.kode || !newItem.jurusan) {
      return NextResponse.json({ error: "Kode dan Jurusan wajib diisi" }, { status: 400 })
    }
    const current = readJsonFile()
    const index = current.findIndex((i) => i.kode === newItem.kode)
    if (index >= 0) {
      current[index] = newItem
    } else {
      current.unshift(newItem)
    }
    writeJsonFile(current)
    return NextResponse.json({ success: true, item: newItem, total: current.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan item"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updatedItem: InventoryItem = await request.json()
    if (!updatedItem.kode) {
      return NextResponse.json({ error: "Kode wajib diisi" }, { status: 400 })
    }
    const current = readJsonFile()
    const index = current.findIndex((i) => i.kode === updatedItem.kode)
    if (index === -1) {
      return NextResponse.json({ error: "Item tidak ditemukan" }, { status: 404 })
    }
    current[index] = { ...current[index], ...updatedItem }
    writeJsonFile(current)
    return NextResponse.json({ success: true, item: current[index] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal memperbarui item"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const kode = searchParams.get("kode")
    if (!kode) {
      return NextResponse.json({ error: "Kode wajib diisi" }, { status: 400 })
    }
    const current = readJsonFile()
    const filtered = current.filter((i) => i.kode !== kode)
    writeJsonFile(filtered)
    return NextResponse.json({ success: true, total: filtered.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus item"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
