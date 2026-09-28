"use client"

import React, { useState, useEffect } from "react"
import { X, Save, PlusCircle, CheckCircle } from "lucide-react"
import { JURUSAN, generateNextCode, type InventoryItem } from "@/lib/inventory"

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
  namaPc: "",
  prosesor: "Core i5",
  ram: "8 GB",
  storage: "256 GB SSD",
  os: "Windows 10 Pro",
  keyboard: "Standard USB",
  mouse: "Standard USB",
  monitor: "SAMSUNG 19 INCH",
  casing: "Standard ATX",
  kondisi: "Baik",
  motherboard: "Standard H61/H81",
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
  const isEditing = Boolean(initialData)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      const initJurusan = "TJKT"
      const newCode = generateNextCode(initJurusan, existingItems)
      setFormData({
        ...defaultForm,
        jurusan: initJurusan,
        kode: newCode,
        lokasi: `Lab ${initJurusan}`,
      })
    }
  }, [initialData, isOpen, existingItems])

  const handleJurusanChange = (newJurusan: string) => {
    if (!isEditing) {
      const newCode = generateNextCode(newJurusan, existingItems)
      setFormData((prev) => ({
        ...prev,
        jurusan: newJurusan,
        kode: newCode,
        lokasi: `Lab ${newJurusan}`,
      }))
    } else {
      setFormData((prev) => ({ ...prev, jurusan: newJurusan }))
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
                {isEditing ? `Edit Unit PC: ${initialData?.kode}` : "Tambah Unit PC Baru"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Perbarui spesifikasi atau kondisi unit komputer"
                  : "Isi formulir untuk menambakan aset komputer ke dalam sistem"}
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
            {/* Jurusan */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Jurusan / Unit *
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

            {/* Kode Aset */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Kode Aset * (Format: JURUSAN-PC-000-YY)
              </label>
              <input
                type="text"
                value={formData.kode}
                onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                className="w-full font-mono text-xs font-bold rounded-lg border border-border bg-background px-3 py-2 text-sky-400 outline-none focus:border-sky-500"
                placeholder="Contoh: TJKT-PC-001-26"
                required
              />
            </div>

            {/* Nama PC */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Nama PC / Hostname
              </label>
              <input
                type="text"
                value={formData.namaPc}
                onChange={(e) => setFormData({ ...formData, namaPc: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Contoh: PC-DESKTOP-01"
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

            {/* Prosesor */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Prosesor (CPU)
              </label>
              <input
                type="text"
                value={formData.prosesor}
                onChange={(e) => setFormData({ ...formData, prosesor: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Core i5-2400 / i3-2120"
              />
            </div>

            {/* RAM */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Kapasitas RAM
              </label>
              <input
                type="text"
                value={formData.ram}
                onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="8 GB / 4 GB"
              />
            </div>

            {/* Storage */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Penyimpanan (Storage)
              </label>
              <input
                type="text"
                value={formData.storage}
                onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="128 GB SSD / 500 GB HDD"
              />
            </div>

            {/* Monitor */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Monitor
              </label>
              <input
                type="text"
                value={formData.monitor}
                onChange={(e) => setFormData({ ...formData, monitor: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="SAMSUNG 19 INCH"
              />
            </div>

            {/* Sistem Operasi */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Sistem Operasi (OS)
              </label>
              <input
                type="text"
                value={formData.os}
                onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Windows 10 Pro 64-bit"
              />
            </div>

            {/* Motherboard */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Motherboard
              </label>
              <input
                type="text"
                value={formData.motherboard}
                onChange={(e) => setFormData({ ...formData, motherboard: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="H61 / H81 Motherboard"
              />
            </div>

            {/* Casing */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Merek Casing
              </label>
              <input
                type="text"
                value={formData.casing}
                onChange={(e) => setFormData({ ...formData, casing: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Standard ATX / Advance"
              />
            </div>

            {/* Lokasi */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Lokasi Ruang
              </label>
              <input
                type="text"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="Lab TJKT"
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
              placeholder="Tambahkan catatan khusus kondisi atau kelengkapan..."
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
              <span>{isEditing ? "Simpan Perubahan" : "Tambah Unit"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
