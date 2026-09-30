"use client"

import React, { useState, useEffect } from "react"
import { X, Save, PlusCircle, CheckCircle, RefreshCw } from "lucide-react"
import {
  JURUSAN,
  KATEGORI_DEVICE,
  generateNextCode,
  getCategoryFromItem,
  type InventoryItem,
} from "@/lib/inventory"
import { getStoredRooms } from "@/lib/rooms"

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: InventoryItem) => void
  initialData?: InventoryItem | null
  existingItems: InventoryItem[]
}

const defaultForm: InventoryItem = {
  jurusan: "TJKT",
  no: "",
  kode: "",
  kategori: "PC",
  namaPc: "",
  prosesor: "-",
  ram: "-",
  storage: "-",
  os: "-",
  keyboard: "-",
  mouse: "-",
  monitor: "-",
  casing: "-",
  kondisi: "Baik",
  motherboard: "-",
  lokasi: "Lab TJKT",
  catatan: "",
}

export function ItemFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingItems,
}: ItemFormModalProps) {
  const [formData, setFormData] = useState<InventoryItem>(defaultForm)
  const [rooms, setRooms] = useState<string[]>([])
  const isEditing = Boolean(initialData)

  useEffect(() => {
    setRooms(getStoredRooms())
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      const kat = getCategoryFromItem(initialData)
      setFormData({ ...initialData, kategori: kat })
    } else {
      const initJurusan = "TJKT"
      const initKat = "PC"
      const initLokasi = "Lab TJKT"
      const newCode = generateNextCode(initLokasi, initKat, existingItems)
      setFormData({
        ...defaultForm,
        jurusan: initJurusan,
        kategori: initKat,
        kode: newCode,
        lokasi: initLokasi,
      })
    }
  }, [initialData, isOpen, existingItems])

  const recalculateCode = (targetLokasi: string, targetKatKey: string) => {
    const katObj = KATEGORI_DEVICE.find((k) => k.key === targetKatKey)
    const prefix = katObj ? katObj.prefix : "PC"
    return generateNextCode(targetLokasi, prefix, existingItems)
  }

  const handleJurusanChange = (newJurusan: string) => {
    if (!isEditing) {
      const newCode = recalculateCode(formData.lokasi || newJurusan, formData.kategori || "PC")
      setFormData((prev) => ({
        ...prev,
        jurusan: newJurusan,
        kode: newCode,
      }))
    } else {
      setFormData((prev) => ({ ...prev, jurusan: newJurusan }))
    }
  }

  const handleKategoriChange = (newKatKey: string) => {
    if (!isEditing) {
      const newCode = recalculateCode(formData.lokasi, newKatKey)
      setFormData((prev) => ({
        ...prev,
        kategori: newKatKey,
        kode: newCode,
      }))
    } else {
      setFormData((prev) => ({ ...prev, kategori: newKatKey }))
    }
  }

  const handleLokasiChange = (newLokasi: string) => {
    if (!isEditing) {
      const newCode = recalculateCode(newLokasi, formData.kategori || "PC")
      setFormData((prev) => ({
        ...prev,
        lokasi: newLokasi,
        kode: newCode,
      }))
    } else {
      setFormData((prev) => ({ ...prev, lokasi: newLokasi }))
    }
  }

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.kode.trim()) {
      alert("Kode Aset tidak boleh kosong")
      return
    }
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
              {isEditing ? <Save className="size-5" /> : <PlusCircle className="size-5" />}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {isEditing ? `Edit Barang: ${initialData?.kode}` : "Tambah Barang / Device Baru"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Perbarui rincian spesifikasi atau kondisi barang"
                  : "Kode aset tergenerasi otomatis secara cerdas sesuai ruangan & kategori yang dipilih"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Lokasi Ruangan */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Lokasi Ruangan * (Mempengaruhi Prefix Kode Aset)
              </label>
              <select
                value={formData.lokasi}
                onChange={(e) => handleLokasiChange(e.target.value)}
                className="w-full rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-bold text-sky-300 outline-none focus:border-sky-500"
                required
              >
                {rooms.map((room) => (
                  <option key={room} value={room} className="bg-card text-foreground">
                    {room}
                  </option>
                ))}
                {!rooms.includes(formData.lokasi) && formData.lokasi && (
                  <option value={formData.lokasi} className="bg-card text-foreground">{formData.lokasi}</option>
                )}
              </select>
            </div>

            {/* Kategori Device */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Kategori Barang / Device *
              </label>
              <select
                value={formData.kategori || "PC"}
                onChange={(e) => handleKategoriChange(e.target.value)}
                className="w-full rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-300 outline-none focus:border-sky-500"
                required
              >
                {KATEGORI_DEVICE.map((k) => (
                  <option key={k.key} value={k.key} className="bg-card text-foreground">
                    [{k.prefix}] {k.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Kode Aset Auto */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground">
                  Kode Aset Otomatis (Format: RUANGAN-KATEGORI-000-YY) *
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = recalculateCode(formData.lokasi, formData.kategori || "PC")
                      setFormData((prev) => ({ ...prev, kode: newCode }))
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                  >
                    <RefreshCw className="size-3" />
                    <span>Regenerate Kode</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                className="w-full font-mono text-sm font-extrabold rounded-lg border border-sky-500/50 bg-background px-3 py-2.5 text-sky-300 outline-none focus:border-sky-500"
                placeholder="Contoh: SERVER-LAP-001-26"
                required
              />
            </div>

            {/* Jurusan / Unit Pemilik */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Jurusan / Unit Pemilik *
              </label>
              <select
                value={formData.jurusan}
                onChange={(e) => handleJurusanChange(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                required
              >
                {JURUSAN.map((j) => (
                  <option key={j.key} value={j.key}>
                    {j.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Device / Merek */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Nama Device / Merek & Tipe *
              </label>
              <input
                type="text"
                value={formData.namaPc}
                onChange={(e) => setFormData({ ...formData, namaPc: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Contoh: Laptop Asus Vivobook / Printer Epson L3210"
                required
              />
            </div>

            {/* Kondisi */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Kondisi Unit *
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                required
              >
                <option value="Baik">Baik</option>
                <option value="Bermasalah">Bermasalah</option>
                <option value="Mati / Rusak">Mati / Rusak</option>
              </select>
            </div>

            {/* Spesifikasi tambahan / Prosesor */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Prosesor / Spesifikasi Utama
              </label>
              <input
                type="text"
                value={formData.prosesor}
                onChange={(e) => setFormData({ ...formData, prosesor: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Contoh: Intel Core i5 / Dual Band Wi-Fi / 3000 Lumens"
              />
            </div>

            {/* RAM */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                RAM / Memori (Opsional)
              </label>
              <input
                type="text"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="8 GB / -"
              />
            </div>

            {/* Storage */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Penyimpanan / Storage (Opsional)
              </label>
              <input
                type="text"
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="512 GB SSD / -"
              />
            </div>

            {/* Monitor / Layar */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Monitor / Ukuran Layar
              </label>
              <input
                type="text"
                value={formData.monitor}
                onChange={(e) => setFormData({ ...formData, monitor: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Layar 14 Inch / Samsung 19 Inch / -"
              />
            </div>

            {/* Sistem Operasi */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Sistem Operasi / Firmware
              </label>
              <input
                type="text"
                value={formData.os}
                onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Windows 11 / RouterOS / -"
              />
            </div>

            {/* Motherboard / Serial */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Serial Number / Model No
              </label>
              <input
                type="text"
                value={formData.motherboard}
                onChange={(e) => setFormData({ ...formData, motherboard: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="SN: 981249124 / Model: TL-WR840N"
              />
            </div>
          </div>

          {/* Catatan */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Catatan Keterangan
            </label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-sky-500"
              placeholder="Tambahkan catatan khusus kondisi, kelengkapan adaptor, garansi, dll..."
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-400"
            >
              <CheckCircle className="size-4" />
              <span>{isEditing ? "Simpan Perubahan" : "Tambah Barang"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
