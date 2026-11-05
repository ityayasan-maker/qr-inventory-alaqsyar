"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  X,
  Save,
  PlusCircle,
  CheckCircle,
  RefreshCw,
  Laptop,
  Armchair,
  Wrench,
  Trash2,
  Calendar,
  UserCheck,
  DollarSign,
  Tv,
  Wifi,
  Network,
  AlertTriangle,
  Layers,
  Info,
} from "lucide-react"
import {
  generateNextCode,
  getItemType,
  type InventoryItem,
  type ItemType,
  type RepairLog,
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
  keyboard: "Standard USB",
  mouse: "Standard USB",
  monitor: "-",
  casing: "-",
  kondisi: "Baik",
  motherboard: "-",
  lokasi: "Lab TJKT",
  catatan: "",
  repairLogs: [],
  serialNumber: "",
  noPc: "",
  ukuranLayar: "19 inci",
  resolusi: "1366x768",
  jenisPanel: "LED",
  portInput: ["VGA"],
  kelengkapanKabel: ["Kabel daya", "Kabel VGA"],
  tipeRouter: "Router Board (mis. MikroTik)",
  portLan: "4",
  portWan: "1",
  standarWifi: "802.11ac",
  frekuensiWifi: ["2.4 GHz", "5 GHz"],
  tipeSwitch: "Unmanaged",
  jumlahPort: "24",
  kecepatanPort: "Gigabit (10/100/1000)",
  dukunganPoe: "Tidak",
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
  repairLogs: [],
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

  // Sub-form for adding repair log inside modal
  const [isAddingRepair, setIsAddingRepair] = useState(false)
  const [newLogDate, setNewLogDate] = useState(new Date().toISOString().slice(0, 10))
  const [newLogDesc, setNewLogDesc] = useState("")
  const [newLogTech, setNewLogTech] = useState("")
  const [newLogCost, setNewLogCost] = useState("")

  // List of all PC units for Monitor's "No PC" relation
  const pcList = useMemo(() => {
    return existingItems.filter(
      (i) => (i.kategori || "").toUpperCase() === "PC" || i.kode.includes("-PC-")
    )
  }, [existingItems])

  // Conflict warning: PC already paired to another monitor
  const pairedConflict = useMemo(() => {
    if (formData.kategori !== "MON" || !formData.noPc) return null
    return existingItems.find(
      (i) =>
        i.kategori === "MON" &&
        i.noPc === formData.noPc &&
        i.kode !== formData.kode
    )
  }, [formData.kategori, formData.noPc, formData.kode, existingItems])

  const toggleArrayItem = (
    field: "portInput" | "kelengkapanKabel" | "frekuensiWifi",
    val: string
  ) => {
    setFormData((prev) => {
      const cur = (prev[field] as string[]) || []
      const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val]
      return { ...prev, [field]: next }
    })
  }

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
      setFormData({
        ...initialData,
        type: detectedType,
        repairLogs: initialData.repairLogs || [],
      })
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
        repairLogs: [],
      })
    }
    setIsAddingRepair(false)
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
          repairLogs: [],
        })
      } else {
        setFormData({
          ...defaultITForm,
          type: "IT",
          kategori: firstKat,
          lokasi: defaultLokasi,
          kode: newCode,
          jurusan: units[0]?.code || "TJKT",
          repairLogs: [],
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

  const handleAddRepairLogEntry = () => {
    if (!newLogDesc.trim()) return
    const entry: RepairLog = {
      id: `rep-${Date.now()}`,
      tanggal: newLogDate || new Date().toISOString().slice(0, 10),
      keterangan: newLogDesc.trim(),
      teknisi: newLogTech.trim() || "Tim IT/GA",
      biaya: newLogCost.trim() || "-",
    }
    setFormData((prev) => ({
      ...prev,
      repairLogs: [entry, ...(prev.repairLogs || [])],
    }))
    setNewLogDesc("")
    setNewLogTech("")
    setNewLogCost("")
    setIsAddingRepair(false)
  }

  const handleDeleteRepairLogEntry = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      repairLogs: (prev.repairLogs || []).filter((log) => log.id !== id),
    }))
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

    if (itemType === "IT") {
      const kat = (formData.kategori || "").toUpperCase()
      if (kat === "MON") {
        if (!formData.serialNumber?.trim()) {
          alert("Serial Number Monitor wajib diisi (cek stiker di belakang monitor)")
          return
        }
        if (!formData.ukuranLayar?.trim()) {
          alert("Ukuran Layar Monitor wajib dipilih / diisi")
          return
        }
        if (pairedConflict) {
          const ok = window.confirm(
            `Perhatian: PC ${formData.noPc} sudah terpasang dengan monitor [${pairedConflict.kode} - ${pairedConflict.namaPc}].\n\nSatu PC idealnya hanya memiliki satu monitor. Apakah Anda yakin tetap ingin menghubungkan monitor ini ke PC tersebut?`
          )
          if (!ok) return
        }
      } else if (kat === "RTR") {
        if (!formData.serialNumber?.trim()) {
          alert("Serial Number Router wajib diisi")
          return
        }
        if (!formData.tipeRouter?.trim()) {
          alert("Tipe Router wajib dipilih")
          return
        }
        if (!formData.portLan?.trim()) {
          alert("Jumlah Port LAN Router wajib diisi")
          return
        }
      } else if (kat === "SW") {
        if (!formData.serialNumber?.trim()) {
          alert("Serial Number Switch wajib diisi")
          return
        }
        if (!formData.tipeSwitch?.trim()) {
          alert("Tipe Switch wajib dipilih")
          return
        }
        if (!formData.jumlahPort?.trim()) {
          alert("Jumlah Port Switch wajib dipilih")
          return
        }
        if (!formData.kecepatanPort?.trim()) {
          alert("Kecepatan Port Switch wajib dipilih")
          return
        }
      }
    }

    onSave({ ...formData, type: itemType })
    onClose()
  }

  const availableCategories = categories.filter((c) => c.type === itemType)
  const currentRepairLogs = formData.repairLogs || []
  const currentKat = (formData.kategori || "").toUpperCase()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-purple-100 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              {isEditing ? <Save className="size-5" /> : <PlusCircle className="size-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditing ? `Edit Barang: ${initialData?.kode}` : "Tambah Inventaris Barang"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? "Perbarui rincian spesifikasi, lokasi, atau riwayat perbaikan"
                  : "Form dinamis otomatis menyesuaikan kategori barang (PC, Monitor, Router, Switch, HR/GA)."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Item Type Switcher Tabs */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleTypeChange("IT")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                itemType === "IT"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 cursor-pointer"
              }`}
            >
              <Laptop className="size-4" />
              <span>Barang IT</span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("NON_IT")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                itemType === "NON_IT"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 cursor-pointer"
              }`}
            >
              <Armchair className="size-4" />
              <span>Barang Non-IT (HR / GA)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Lokasi Ruangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Lokasi Ruangan *
              </label>
              <select
                value={formData.lokasi}
                onChange={(e) => handleLokasiChange(e.target.value)}
                className="w-full rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2 text-sm font-semibold text-purple-900 outline-none focus:border-purple-500 focus:bg-white"
                required
              >
                {rooms.map((room) => (
                  <option key={room} value={room} className="text-slate-800">
                    {room}
                  </option>
                ))}
                {!rooms.includes(formData.lokasi) && formData.lokasi && (
                  <option value={formData.lokasi} className="text-slate-800">{formData.lokasi}</option>
                )}
              </select>
            </div>

            {/* Kategori Barang */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kategori Barang * ({itemType === "IT" ? "IT" : "Non-IT"})
              </label>
              <select
                value={formData.kategori || (itemType === "IT" ? "PC" : "MEJA")}
                onChange={(e) => handleKategoriChange(e.target.value)}
                className="w-full rounded-lg border border-purple-200 bg-purple-50/50 px-3 py-2 text-sm font-semibold text-purple-900 outline-none focus:border-purple-500 focus:bg-white"
                required
              >
                {availableCategories.map((k) => (
                  <option key={k.id} value={k.code} className="text-slate-800">
                    [{k.code}] {k.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Kode Aset Auto */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-600">
                  {itemType === "NON_IT" ? "Kode Inventaris HR / GA *" : "Kode Aset Otomatis IT *"}
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const newCode = recalculateCode(itemType, formData.lokasi, formData.kategori || "PC")
                      setFormData((prev) => ({ ...prev, kode: newCode }))
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:underline cursor-pointer"
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
                className="w-full font-mono text-sm font-bold rounded-lg border border-purple-300 bg-purple-50/30 px-3 py-2 text-purple-900 outline-none focus:border-purple-600 focus:bg-white"
                placeholder={itemType === "NON_IT" ? "Contoh: GA-MJA-001-26" : "Contoh: TJKT-MON-001-26"}
                required
              />
            </div>

            {/* Jurusan / Unit Pemilik */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Jurusan / Unit Pemilik *
              </label>
              <select
                value={formData.jurusan}
                onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
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
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Barang / Device *
              </label>
              <input
                type="text"
                value={formData.namaPc}
                onChange={(e) => setFormData({ ...formData, namaPc: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                placeholder={
                  itemType === "NON_IT"
                    ? "Contoh: Meja Siswa Kayu Jati / AC Daikin 1.5 PK"
                    : currentKat === "MON"
                    ? "Contoh: SAMSUNG S19A / LG 24MP400"
                    : currentKat === "RTR"
                    ? "Contoh: TP-LINK Archer C6 / MikroTik RB750Gr3"
                    : currentKat === "SW"
                    ? "Contoh: TP-LINK TL-SG1024D / Cisco Catalyst"
                    : "Contoh: Laptop Asus Vivobook / PC Lab-01"
                }
                required
              />
            </div>

            {/* Kondisi */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kondisi Barang *
              </label>
              <select
                value={formData.kondisi}
                onChange={(e) => setFormData({ ...formData, kondisi: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                required
              >
                <option value="Baik">Baik</option>
                <option value="Rusak Ringan">Rusak Ringan / Bermasalah</option>
                <option value="Rusak Berat">Rusak Berat / Mati</option>
              </select>
            </div>

            {/* Serial Number (Wajib untuk MON, RTR, SW) */}
            {(itemType === "IT" && (currentKat === "MON" || currentKat === "RTR" || currentKat === "SW")) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Serial Number (SN) *
                </label>
                <input
                  type="text"
                  value={formData.serialNumber || ""}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                  placeholder="Dari stiker belakang/bawah perangkat"
                  required
                />
              </div>
            )}

            {/* MAC Address (Untuk Router & Switch) */}
            {(itemType === "IT" && (currentKat === "RTR" || currentKat === "SW")) && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  MAC Address
                </label>
                <input
                  type="text"
                  value={formData.macAddress || ""}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-purple-500"
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </div>
            )}

            {/* ======================================================== */}
            {/* DYNAMIC FORM SECTION 1: NON_IT (HR/GA)                   */}
            {/* ======================================================== */}
            {itemType === "NON_IT" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Merek / Model
                  </label>
                  <input
                    type="text"
                    value={formData.merekModel || ""}
                    onChange={(e) => setFormData({ ...formData, merekModel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: Daikin Inverter / Olympic / Lion"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Bahan / Warna
                  </label>
                  <input
                    type="text"
                    value={formData.bahanWarna || ""}
                    onChange={(e) => setFormData({ ...formData, bahanWarna: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: Kayu Cokelat / Besi Hitam"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tanggal Perolehan
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalPerolehan || ""}
                    onChange={(e) => setFormData({ ...formData, tanggalPerolehan: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Harga Perolehan
                  </label>
                  <input
                    type="text"
                    value={formData.hargaPerolehan || ""}
                    onChange={(e) => setFormData({ ...formData, hargaPerolehan: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: Rp 2.500.000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Penanggung Jawab (PJ)
                  </label>
                  <input
                    type="text"
                    value={formData.penanggungJawab || ""}
                    onChange={(e) => setFormData({ ...formData, penanggungJawab: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: Pak Budi (Koor GA) / Ibu Siti"
                  />
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* DYNAMIC FORM SECTION 2: KATEGORI [MON] MONITOR           */}
            {/* ======================================================== */}
            {itemType === "IT" && currentKat === "MON" && (
              <>
                {/* No PC Dropdown Relasi */}
                <div className="sm:col-span-2 rounded-xl border border-purple-200 bg-purple-50/60 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-purple-950">
                      No PC Terhubung (Satu Set dengan Monitor)
                    </label>
                    <span className="text-[11px] text-purple-700">
                      Boleh kosong jika monitor cadangan / stok
                    </span>
                  </div>
                  <select
                    value={formData.noPc || ""}
                    onChange={(e) => setFormData({ ...formData, noPc: e.target.value })}
                    className="w-full rounded-lg border border-purple-300 bg-white px-3 py-2 text-sm font-semibold text-purple-900 outline-none focus:border-purple-600"
                  >
                    <option value="">(Tidak terpasang / Cadangan / Stok)</option>
                    {pcList.map((pc) => (
                      <option key={pc.kode} value={pc.kode}>
                        {pc.kode} — {pc.namaPc} ({pc.lokasi})
                      </option>
                    ))}
                  </select>

                  {/* Warning jika PC sudah dipasangkan dengan monitor lain */}
                  {pairedConflict && (
                    <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-300 p-2 text-xs text-amber-800">
                      <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <strong>Peringatan Pasangan PC:</strong> PC <u>{formData.noPc}</u> sudah tercatat memiliki monitor <strong>{pairedConflict.kode}</strong> ({pairedConflict.namaPc}).
                      </div>
                    </div>
                  )}
                </div>

                {/* Ukuran Layar */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ukuran Layar *
                  </label>
                  <select
                    value={formData.ukuranLayar || "19 inci"}
                    onChange={(e) => setFormData({ ...formData, ukuranLayar: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    required
                  >
                    <option value="17 inci">17 inci</option>
                    <option value="18.5 inci">18.5 inci</option>
                    <option value="19 inci">19 inci</option>
                    <option value="20 inci">20 inci</option>
                    <option value="21.5 inci">21.5 inci</option>
                    <option value="24 inci">24 inci</option>
                    <option value="27 inci">27 inci</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Resolusi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Resolusi
                  </label>
                  <select
                    value={formData.resolusi || "1366x768"}
                    onChange={(e) => setFormData({ ...formData, resolusi: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                  >
                    <option value="1366x768">1366 x 768 (HD)</option>
                    <option value="1600x900">1600 x 900 (HD+)</option>
                    <option value="1920x1080">1920 x 1080 (Full HD)</option>
                    <option value="2560x1440">2560 x 1440 (2K)</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                {/* Jenis Panel */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jenis Panel
                  </label>
                  <select
                    value={formData.jenisPanel || "LED"}
                    onChange={(e) => setFormData({ ...formData, jenisPanel: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                  >
                    <option value="LED">LED</option>
                    <option value="IPS">IPS</option>
                    <option value="LCD">LCD</option>
                    <option value="VA">VA</option>
                    <option value="TN">TN</option>
                  </select>
                </div>

                {/* Port Input Checkbox */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Port Input Monitor (Multi-pilih)
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {["VGA", "HDMI", "DVI", "DisplayPort"].map((port) => {
                      const checked = (formData.portInput || []).includes(port)
                      return (
                        <label
                          key={port}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                            checked
                              ? "border-purple-500 bg-purple-50 text-purple-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleArrayItem("portInput", port)}
                            className="accent-purple-600"
                          />
                          <span>{port}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Kelengkapan Kabel Checkbox */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Kelengkapan Kabel (Multi-pilih)
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {["Kabel daya", "Kabel VGA", "Kabel HDMI", "Kabel DisplayPort"].map((kabel) => {
                      const checked = (formData.kelengkapanKabel || []).includes(kabel)
                      return (
                        <label
                          key={kabel}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors ${
                            checked
                              ? "border-purple-500 bg-purple-50 text-purple-900"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleArrayItem("kelengkapanKabel", kabel)}
                            className="accent-purple-600"
                          />
                          <span>{kabel}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* DYNAMIC FORM SECTION 3: KATEGORI [RTR] ROUTER            */}
            {/* ======================================================== */}
            {itemType === "IT" && currentKat === "RTR" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipe Router *
                  </label>
                  <select
                    value={formData.tipeRouter || "Router Board (mis. MikroTik)"}
                    onChange={(e) => setFormData({ ...formData, tipeRouter: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    required
                  >
                    <option value="Router Board (mis. MikroTik)">Router Board (mis. MikroTik)</option>
                    <option value="Router Wireless">Router Wireless</option>
                    <option value="Router Kabel">Router Kabel</option>
                    <option value="Access Point">Access Point</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jumlah Port LAN *
                  </label>
                  <input
                    type="number"
                    value={formData.portLan || "4"}
                    onChange={(e) => setFormData({ ...formData, portLan: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: 4"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jumlah Port WAN
                  </label>
                  <input
                    type="number"
                    value={formData.portWan || "1"}
                    onChange={(e) => setFormData({ ...formData, portWan: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Standar Wi-Fi
                  </label>
                  <select
                    value={formData.standarWifi || "802.11ac"}
                    onChange={(e) => setFormData({ ...formData, standarWifi: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                  >
                    <option value="Tidak ada">Tidak ada (Kabel saja)</option>
                    <option value="802.11n">Wi-Fi 4 (802.11n)</option>
                    <option value="802.11ac">Wi-Fi 5 (802.11ac)</option>
                    <option value="802.11ax">Wi-Fi 6 (802.11ax)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    IP Address Default / Manajemen
                  </label>
                  <input
                    type="text"
                    value={formData.ipAddress || ""}
                    onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-purple-500"
                    placeholder="192.168.1.1 / 192.168.88.1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Firmware / OS
                  </label>
                  <input
                    type="text"
                    value={formData.firmware || ""}
                    onChange={(e) => setFormData({ ...formData, firmware: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: RouterOS 7.x / OpenWrt"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Terhubung ke (Uplink)
                  </label>
                  <input
                    type="text"
                    value={formData.uplink || ""}
                    onChange={(e) => setFormData({ ...formData, uplink: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: ISP Telkom / Switch Server Utama"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Frekuensi Wi-Fi
                  </label>
                  <div className="flex gap-4">
                    {["2.4 GHz", "5 GHz"].map((freq) => {
                      const checked = (formData.frekuensiWifi || []).includes(freq)
                      return (
                        <label
                          key={freq}
                          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                            checked
                              ? "border-purple-500 bg-purple-50 text-purple-900"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleArrayItem("frekuensiWifi", freq)}
                            className="accent-purple-600"
                          />
                          <span>{freq}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* DYNAMIC FORM SECTION 4: KATEGORI [SW] SWITCH             */}
            {/* ======================================================== */}
            {itemType === "IT" && currentKat === "SW" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tipe Switch *
                  </label>
                  <select
                    value={formData.tipeSwitch || "Unmanaged"}
                    onChange={(e) => setFormData({ ...formData, tipeSwitch: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    required
                  >
                    <option value="Unmanaged">Unmanaged</option>
                    <option value="Managed">Managed</option>
                    <option value="PoE">PoE (Power over Ethernet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jumlah Port *
                  </label>
                  <select
                    value={formData.jumlahPort || "24"}
                    onChange={(e) => setFormData({ ...formData, jumlahPort: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    required
                  >
                    <option value="5">5 Port</option>
                    <option value="8">8 Port</option>
                    <option value="16">16 Port</option>
                    <option value="24">24 Port</option>
                    <option value="48">48 Port</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kecepatan Port *
                  </label>
                  <select
                    value={formData.kecepatanPort || "Gigabit (10/100/1000)"}
                    onChange={(e) => setFormData({ ...formData, kecepatanPort: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    required
                  >
                    <option value="Gigabit (10/100/1000)">Gigabit (10/100/1000 Mbps)</option>
                    <option value="Fast Ethernet (10/100)">Fast Ethernet (10/100 Mbps)</option>
                    <option value="10G SFP+">10G SFP+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Port SFP / Uplink
                  </label>
                  <input
                    type="number"
                    value={formData.portSfp || "2"}
                    onChange={(e) => setFormData({ ...formData, portSfp: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: 2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Dukungan PoE
                  </label>
                  <select
                    value={formData.dukunganPoe || "Tidak"}
                    onChange={(e) => setFormData({ ...formData, dukunganPoe: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                  >
                    <option value="Tidak">Tidak</option>
                    <option value="Ya">Ya (Mendukung PoE)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    IP Management (Hanya Switch Managed)
                  </label>
                  <input
                    type="text"
                    value={formData.ipManagement || ""}
                    onChange={(e) => setFormData({ ...formData, ipManagement: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono text-slate-800 outline-none focus:border-purple-500"
                    placeholder="192.168.1.254"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Posisi Pemasangan
                  </label>
                  <input
                    type="text"
                    value={formData.posisiPemasangan || ""}
                    onChange={(e) => setFormData({ ...formData, posisiPemasangan: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Rak Server Rack 1 / Meja / Dinding"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Terhubung ke (Uplink)
                  </label>
                  <input
                    type="text"
                    value={formData.uplink || ""}
                    onChange={(e) => setFormData({ ...formData, uplink: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Router Utama / Switch Lantai 2"
                  />
                </div>
              </>
            )}

            {/* ======================================================== */}
            {/* DYNAMIC FORM SECTION 5: PC / LAPTOP (DEFAULT IT)         */}
            {/* ======================================================== */}
            {itemType === "IT" && currentKat !== "MON" && currentKat !== "RTR" && currentKat !== "SW" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Prosesor / Spesifikasi Utama
                  </label>
                  <input
                    type="text"
                    value={formData.prosesor || ""}
                    onChange={(e) => setFormData({ ...formData, prosesor: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: Intel Core i5-2400 / Core i3"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    RAM / Memori
                  </label>
                  <input
                    type="text"
                    value={formData.ram || ""}
                    onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: 8 GB DDR3 / 16 GB DDR4"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Penyimpanan / Storage
                  </label>
                  <input
                    type="text"
                    value={formData.storage || ""}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: 256 GB SSD / 500 GB HDD"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Monitor Terhubung
                  </label>
                  <input
                    type="text"
                    value={formData.monitor || ""}
                    onChange={(e) => setFormData({ ...formData, monitor: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: TJKT-MON-001-26 / SAMSUNG 19 INCH"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Keyboard
                  </label>
                  <input
                    type="text"
                    value={formData.keyboard || ""}
                    onChange={(e) => setFormData({ ...formData, keyboard: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Standard USB / Logitech K120"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Mouse
                  </label>
                  <input
                    type="text"
                    value={formData.mouse || ""}
                    onChange={(e) => setFormData({ ...formData, mouse: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Standard USB / Logitech B100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Sistem Operasi / OS
                  </label>
                  <input
                    type="text"
                    value={formData.os || ""}
                    onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Windows 10 Pro / Windows 11 / Linux"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Motherboard / Serial Number
                  </label>
                  <input
                    type="text"
                    value={formData.motherboard || formData.serialNumber || ""}
                    onChange={(e) => setFormData({ ...formData, motherboard: e.target.value, serialNumber: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="H61M / SN: 981249124"
                  />
                </div>
              </>
            )}

            {/* Administrasi Umum untuk IT (MON, RTR, SW, PC) */}
            {itemType === "IT" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tahun Perolehan
                  </label>
                  <input
                    type="number"
                    value={formData.tahunPerolehan || ""}
                    onChange={(e) => setFormData({ ...formData, tahunPerolehan: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                    placeholder="Contoh: 2022"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Sumber Dana
                  </label>
                  <select
                    value={formData.sumberDana || "BOS"}
                    onChange={(e) => setFormData({ ...formData, sumberDana: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-purple-500"
                  >
                    <option value="BOS">BOS (Bantuan Operasional Sekolah)</option>
                    <option value="Yayasan">Yayasan</option>
                    <option value="Hibah">Hibah / Bantuan Pemerintah</option>
                    <option value="Komite">Komite Sekolah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Catatan / Keterangan */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Catatan Keterangan
            </label>
            <textarea
              value={formData.catatan}
              onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none focus:border-purple-500"
              placeholder="Tambahkan catatan khusus kondisi, kelengkapan, garansi, dll..."
            />
          </div>

          {/* RIWAYAT PERBAIKAN DI FORM (SETELAH CATATAN KETERANGAN) */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="size-4 text-purple-700" />
                <h3 className="text-xs font-bold text-slate-800">Riwayat Perbaikan Unit</h3>
                <span className="rounded-full bg-purple-100 border border-purple-200 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                  {currentRepairLogs.length} Catatan
                </span>
              </div>
              {!isAddingRepair && (
                <button
                  type="button"
                  onClick={() => setIsAddingRepair(true)}
                  className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-700 shadow-2xs"
                >
                  <PlusCircle className="size-3.5" />
                  <span>+ Tambah Riwayat</span>
                </button>
              )}
            </div>

            {/* Form Tambah Riwayat Baru */}
            {isAddingRepair && (
              <div className="rounded-lg border border-purple-200 bg-white p-3 space-y-2.5 shadow-2xs">
                <p className="text-xs font-bold text-purple-900">Catat Perbaikan Baru</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tanggal Perbaikan</label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                      <input
                        type="date"
                        value={newLogDate}
                        onChange={(e) => setNewLogDate(e.target.value)}
                        className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-xs text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Teknisi / PJ</label>
                    <div className="relative">
                      <UserCheck className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={newLogTech}
                        onChange={(e) => setNewLogTech(e.target.value)}
                        placeholder="Contoh: Pak Dede / Tim IT"
                        className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-xs text-slate-800 outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Detail Perbaikan / Penggantian Sparepart *</label>
                  <input
                    type="text"
                    value={newLogDesc}
                    onChange={(e) => setNewLogDesc(e.target.value)}
                    placeholder="Contoh: Ganti Power Supply 500W & bersihkan debu kipas"
                    className="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Biaya Perbaikan (Opsional)</label>
                  <div className="relative">
                    <DollarSign className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={newLogCost}
                      onChange={(e) => setNewLogCost(e.target.value)}
                      placeholder="Contoh: Rp 250.000 / Garansi"
                      className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-2 text-xs text-slate-800 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingRepair(false)}
                    className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddRepairLogEntry}
                    disabled={!newLogDesc.trim()}
                    className="rounded-md bg-purple-600 px-3 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    Tambahkan ke Riwayat
                  </button>
                </div>
              </div>
            )}

            {/* List Riwayat */}
            <div className="space-y-1.5">
              {currentRepairLogs.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-1">
                  Belum ada catatan riwayat perbaikan untuk barang ini.
                </p>
              ) : (
                currentRepairLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-purple-700">{log.tanggal}</span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="font-medium text-slate-600">Teknisi: {log.teknisi || "Tim IT/GA"}</span>
                      </div>
                      <p className="mt-0.5 font-semibold text-slate-800">{log.keterangan}</p>
                      {log.biaya && log.biaya !== "-" && (
                        <p className="text-[11px] text-emerald-600 font-medium">Biaya: {log.biaya}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRepairLogEntry(log.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus catatan perbaikan ini"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-purple-600/20 transition-all hover:bg-purple-700"
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
