import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import rawInventory from "@/lib/inventory.json"
import type { InventoryItem } from "@/lib/inventory"

declare global {
  var _globalInventoryStore: InventoryItem[] | undefined
}

const jsonFilePath = path.join(process.cwd(), "lib", "inventory.json")

function readInitialDataset(): InventoryItem[] {
  try {
    if (fs.existsSync(jsonFilePath)) {
      const data = fs.readFileSync(jsonFilePath, "utf8")
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error("Error reading inventory.json:", err)
  }
  return rawInventory as InventoryItem[]
}

function getMemoryStore(): InventoryItem[] {
  if (!globalThis._globalInventoryStore || globalThis._globalInventoryStore.length === 0) {
    globalThis._globalInventoryStore = readInitialDataset()
  }
  return globalThis._globalInventoryStore
}

function setMemoryStore(data: InventoryItem[]) {
  globalThis._globalInventoryStore = data
  try {
    if (fs.existsSync(jsonFilePath)) {
      fs.writeFileSync(jsonFilePath, JSON.stringify(data, null, 2), "utf8")
    }
  } catch (e) {
    // Ignore read-only filesystem errors in Vercel serverless
  }
}

export async function GET() {
  const data = getMemoryStore()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  try {
    const newItem: InventoryItem = await request.json()
    if (!newItem.kode) {
      return NextResponse.json({ error: "Kode aset wajib diisi" }, { status: 400 })
    }
    const current = getMemoryStore()
    const index = current.findIndex((i) => i.kode.toUpperCase() === newItem.kode.toUpperCase())
    if (index >= 0) {
      current[index] = { ...current[index], ...newItem }
    } else {
      current.unshift(newItem)
    }
    setMemoryStore(current)
    return NextResponse.json({ success: true, item: newItem, total: current.length, data: current })
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
    const current = getMemoryStore()
    const index = current.findIndex((i) => i.kode.toUpperCase() === updatedItem.kode.toUpperCase())
    if (index === -1) {
      // Append if not found
      current.unshift(updatedItem)
    } else {
      current[index] = { ...current[index], ...updatedItem }
    }
    setMemoryStore(current)
    return NextResponse.json({ success: true, item: updatedItem, data: current })
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
    const current = getMemoryStore()
    const filtered = current.filter((i) => i.kode.toUpperCase() !== kode.toUpperCase())
    setMemoryStore(filtered)
    return NextResponse.json({ success: true, total: filtered.length, data: filtered })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menghapus item"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
