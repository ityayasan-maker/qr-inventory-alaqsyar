"use client"

import React, { useState, useEffect } from "react"
import { X, Save, PlusCircle, CheckCircle, RefreshCw, Laptop, Armchair } from "lucide-react"
import {
  generateNextCode,
  getItemType,
  type InventoryItem,
  type ItemType,
} from "@/lib/inventory"
import { getStoredCategories, getStoredUnits, type CategoryItem, type UnitItem } from "@/lib/master-data"
import { getStoredRooms } from "@/lib/rooms"

interface ItemFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (item: InventoryItem) => void
  initialData?: InventoryItem | null
  existingItems: InventoryItem[]
}

const defaultITForm: InventoryItem = {
  type: "IT",
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

const defaultNonITForm: InventoryItem = {
  type: "NON_IT",
  jurusan: "HRGA",
  no: "",
  kode: "",
  kategori: "MEJA",
  namaPc: "",
  merekModel: "",
  bahanWarna: "",
  tanggalPerolehan: "",
  hargaPerolehan: "",
  penanggungJawab: "",
  kondisi: "Baik",
  lokasi: "Ruang HR / GA",
  catatan: "",
}

export function ItemFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingItems,
}: ItemFormModalProps) {
  const [itemType, setItemType] = useState<ItemType>("IT")
  const [formData, setFormData] = useState<InventoryItem>(defaultITForm)
  const [rooms, setRooms] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [units, setUnits] = useState<UnitItem[]>([])
  const isEditing = Boolean(initialData)

  useEffect(() => {
    if (isOpen) {
      setRooms(getStoredRooms())
      setCategories(getStoredCategories().filter((c) => c.active))
      setUnits(getStoredUnits().filter((u) => u.active))
    }
  }, [isOpen])

  useEffect(() => {
    if (initialData) {
      const detectedType = getItemType(initialData)
      setItemType(detectedType)
      setFormData({ ...initialData, type: detectedType })
    } else {
      const activeCats = getStoredCategories().filter((c) => c.active)
      const activeUnits = getStoredUnits().filter((u) => u.active)
      const activeRooms = getStoredRooms()

      const defaultUnitCode = activeUnits[0]?.code || "TJKT"
      const defaultRoom = activeRooms[0] || "Lab TJKT"
      
      const defaultType: ItemType = "IT"
      setItemType(defaultType)
      const defaultKatObj = activeCats.find((c) => c.type === defaultType) || activeCats[0]
      const katCode = defaultKatObj ? defaultKatObj.code : "PC"

      const newCode = generateNextCode(defaultRoom, katCode, existingItems, defaultType)
      setFormData({
        ...defaultITForm,
        type: defaultType,
        jurusan: defaultUnitCode,
        kategori: katCode,
        kode: newCode,
        lokasi: defaultRoom,
      })
    }
  }, [initialData, isOpen, existingItems])

  const recalculateCode = (targetType: ItemType, targetLokasi: string, targetKatCode: string) => {
    return generateNextCode(targetLokasi, targetKatCode, existingItems, targetType)
  }

  const handleTypeChange = (newType: ItemType) => {
    setItemType(newType)
    if (!isEditing) {
      const typeCats = categories.filter((c) => c.type === newType)
      const firstKat = typeCats[0]?.code || (newType === "IT" ? "PC" : "MEJA")
      const defaultLokasi = rooms[0] || (newType === "IT" ? "Lab TJKT" : "Ruang HR / GA")
      const newCode = recalculateCode(newType, defaultLokasi, firstKat)

      if (newType === "NON_IT") {
        setFormData({
          ...defaultNonITForm,
          type: "NON_IT",
          kategori: firstKat,
          lokasi: defaultLokasi,
          kode: newCode,
          jurusan: units.find((u) => u.code === "HRGA")?.code || units[0]?.code || "HRGA",
        })
      } else {
        setFormData({
          ...defaultITForm,
          type: "IT",
          kategori: firstKat,
          lokasi: defaultLokasi,
          kode: newCode,
          jurusan: units[0]?.code || "TJKT",
        })
      }
    } else {
      setFormData((prev) => ({ ...prev, type: newType }))
    }
  }

  const handleKategoriChange = (newKatCode: string) => {
    if (!isEditing) {
      const newCode = recalculateCode(itemType, formData.lokasi || "RUANG", newKatCode)
      setFormData((prev) => ({
        ...prev,
        kategori: newKatCode,
        kode: newCode,
      }))
    } else {
      setFormData((prev) => ({ ...prev, kategori: newKatCode }))
    }
  }

  const handleLokasiChange = (newLokasi: string) => {
    if (!isEditing) {
      const newCode = recalculateCode(itemType, newLokasi, formData.kategori || "PC")
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
    if (!formData.namaPc.trim()) {
      alert("Nama Barang / Device tidak boleh kosong")
      return
    }
    onSave({ ...formData, type: itemType })
    onClose()
  }

  const availableCategories = categories.filter((c) => c.type === itemType)

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
                {isEditing ? `Edit Barang: ${initialData?.kode}` : "Tambah Inventaris Barang"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing
                  ? "Perbarui rincian barang IT atau Non-IT"
                  : "Pilih jenis barang, kategori, dan lokasi. Kode aset dibuat otomatis"}
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Item Type Switcher Tabs */}
          <div className="flex rounded-xl border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => handleTypeChange("IT")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                itemType === "IT"
                  ? "bg-sky-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Laptop className="size-4" />
              <span>Barang IT</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("NON_IT")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold transition-all ${
                itemType === "NON_IT"
                  ? "bg-amber-500 text-white shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Armchair className="size-4" />
              <span>Barang Non-IT (HR / GA)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Lokasi Ruangan */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Lokasi Ruangan *
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

            {/* Kategori Barang */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Kategori Barang * ({itemType === "IT" ? "IT" : "Non-IT"})
              </label>
              <select
                value={formData.kategori || (itemType === "IT" ? "PC" : "MEJA")}
                onChange={(e) => handleKategoriChange(e.target.value)}
                className="w-full rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-300 outline-none focus:border-sky-500"
                required
              >
                {availableCategories.map((k) => (
                  <option key={k.id} value={k.code} className="bg-card text-foreground">
                    [{k.code}] {k.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kode Aset Auto / HR/GA Code */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-muted-foreground">
                  {itemType === "NON_IT" ? "Kode Inventaris HR / GA *" : "Kode Aset Otomatis IT *"}
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = recalculateCode(itemType, formData.lokasi, formData.kategori || "PC")
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
                placeholder={itemType === "NON_IT" ? "Contoh: GA-MJA-001-26 atau HR-INF-04" : "Contoh: TJKT-PC-001-26"}
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
                onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                required
              >
                {units.map((u) => (
                  <option key={u.id} value={u.code}>
                    {u.name} ({u.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Nama Barang */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Nama Barang / Device *
              </label>
              <input
                type="text"
                value={formData.namaPc}
                onChange={(e) => setFormData({ ...formData, namaPc: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder={itemType === "NON_IT" ? "Contoh: Meja Kerja Kayu Jati / AC Daikin 1.5 PK" : "Contoh: Laptop Asus Vivobook / PC Lab-01"}
                required
              />
            </div>

            {/* Kondisi */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Kondisi Barang *
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                required
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan / Bermasalah</option>
                <option value="Rusak Berat">Rusak Berat / Mati</option>
              </select>
            </div>

            {/* DYNAMIC FIELDS BASED ON TYPE */}
            {itemType === "NON_IT" ? (
              <>
                {/* Merek / Model */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Merek / Model
                  </label>
                  <input
                    type="text"
                    value={formData.merekModel || ""}
                    onChange={(e) => setFormData({ ...formData, merekModel: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                    placeholder="Contoh: Daikin Inverter 1.5PK / Olympic / Lion"
                  />
                </div>

                {/* Bahan / Warna */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Bahan / Warna
                  </label>
                  <input
                    type="text"
                    value={formData.bahanWarna || ""}
                    onChange={(e) => setFormData({ ...formData, bahanWarna: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                    placeholder="Contoh: Kayu Cokelat / Besi Hitam / Plastik Putih"
                  />
                </div>

                {/* Tanggal Perolehan */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Tanggal Perolehan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalPerolehan || ""}
                    onChange={(e) => setFormData({ ...formData, tanggalPerolehan: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                  />
                </div>

                {/* Harga Perolehan */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Harga Perolehan
                  </label>
                  <input
                    type="text"
                    value={formData.hargaPerolehan || ""}
                    onChange={(e) => setFormData({ ...formData, hargaPerolehan: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                    placeholder="Contoh: Rp 2.500.000"
                  />
                </div>

                {/* Penanggung Jawab */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Penanggung Jawab (PJ)
                  </label>
                  <input
                    type="text"
                    value={formData.penanggungJawab || ""}
                    onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                    placeholder="Contoh: Pak Budi (Koor GA) / Ibu Siti (Kepala Perpustakaan)"
                  />
                </div>
              </>
            ) : (
              <>
                {/* IT SPECS FIELDS */}
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

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    RAM / Memori
                  </label>
                  <input
                    type="text"
                    value={formData.ram}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                    placeholder="8 GB / 16 GB / -"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Penyimpanan / Storage
                  </label>
                  <input
                    type="text"
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                    placeholder="512 GB SSD / 1 TB HDD / -"
                  />
                </div>

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

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">
                    Sistem Operasi / Firmware
                  </label>
                  <input
                    type="text"
                    value={formData.os}
                    onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-sky-500"
                    placeholder="Windows 11 Pro / RouterOS / -"
                  />
                </div>

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
              </>
            )}
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Catatan Keterangan
            </label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-sky-500"
              placeholder="Tambahkan catatan khusus kondisi, kelengkapan, garansi, dll..."
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
