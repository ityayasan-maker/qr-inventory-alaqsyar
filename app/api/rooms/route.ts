import { NextResponse } from "next/server"

declare global {
  var _globalRoomsStore: string[] | undefined
}

const DEFAULT_ROOMS = [
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

function getMemoryRooms(): string[] {
  if (!globalThis._globalRoomsStore || globalThis._globalRoomsStore.length === 0) {
    globalThis._globalRoomsStore = DEFAULT_ROOMS
  }
  return globalThis._globalRoomsStore
}

export async function GET() {
  const rooms = getMemoryRooms()
  return NextResponse.json(rooms)
}

export async function POST(request: Request) {
  try {
    const { room } = await request.json()
    if (!room || typeof room !== "string") {
      return NextResponse.json({ error: "Nama ruangan wajib diisi" }, { status: 400 })
    }
    const clean = room.trim()
    const current = getMemoryRooms()
    const exists = current.some((r) => r.toLowerCase() === clean.toLowerCase())
    if (!exists) {
      current.push(clean)
      globalThis._globalRoomsStore = current
    }
    return NextResponse.json({ success: true, rooms: current })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal menambahkan ruangan"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
