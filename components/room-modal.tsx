"use client"

import React, { useState } from "react"
import { Building2, Plus, Trash2, X, Check } from "lucide-react"
import { addRoom, getStoredRooms, saveStoredRooms } from "@/lib/rooms"

interface RoomModalProps {
  isOpen: boolean
  onClose: () => void
  onRoomsUpdated: (rooms: string[]) => void
}

export function RoomModal({ isOpen, onClose, onRoomsUpdated }: RoomModalProps) {
  const [newRoom, setNewRoom] = useState("")
  const [rooms, setRooms] = useState<string[]>(getStoredRooms())

  if (!isOpen) return null

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoom.trim()) return
    const updated = addRoom(newRoom.trim())
    setRooms(updated)
    setNewRoom("")
    onRoomsUpdated(updated)
  }

  const handleDelete = (roomToDelete: string) => {
    if (confirm(`Hapus ruangan "${roomToDelete}" dari daftar master?`)) {
      const updated = rooms.filter((r) => r.toLowerCase() !== roomToDelete.toLowerCase())
      saveStoredRooms(updated)
      setRooms(updated)
      onRoomsUpdated(updated)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-lg rounded-2xl border border-sky-500/30 bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <Building2 className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Kelola Master Ruangan</h3>
            <p className="text-xs text-muted-foreground">Tambah atau hapus daftar ruangan & lokasi aset sekolah</p>
          </div>
        </div>

        {/* Add Room Form */}
        <form onSubmit={handleAdd} className="mt-6 flex gap-2">
          <input
            type="text"
            value={newRoom}
            onChange={(e) => setNewRoom(e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
            placeholder="Contoh: Lab Robotics / Ruang Rapat Lt. 2"
            required
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-400"
          >
            <Plus className="size-4" />
            <span>Tambah</span>
          </button>
        </form>

        {/* Room List */}
        <div className="mt-4 max-h-60 overflow-y-auto rounded-xl border border-border bg-background p-2 space-y-1">
          {rooms.map((room) => (
            <div
              key={room}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-sky-400 shrink-0" />
                <span className="font-medium">{room}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(room)}
                className="rounded-md p-1 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400"
                title="Hapus ruangan"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-400"
          >
            <Check className="size-4" />
            <span>Selesai</span>
          </button>
        </div>
      </div>
    </div>
  )
}
