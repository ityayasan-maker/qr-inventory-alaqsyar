"use client"

import { useMemo, useState, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Cpu,
  HardDrive,
  MemoryStick,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  Filter,
  Building2,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Tags,
  Armchair,
  Laptop,
  User,
  Wrench,
  ShieldAlert,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react"
import {
  inventory as defaultRawInventory,
  getStats,
  kondisiStatus,
  kondisiMeta,
  getStoredInventory,
  saveStoredInventory,
  getCategoryFromItem,
  getItemType,
  type InventoryItem,
  type ItemType,
} from "@/lib/inventory"
import { getStoredCategories, getStoredUnits, type CategoryItem, type UnitItem } from "@/lib/master-data"
import { getStoredSession, logoutAdmin, type UserSession } from "@/lib/auth"
import { getStoredRooms } from "@/lib/rooms"
import { StatCards } from "@/components/stat-cards"
import { ItemFormModal } from "@/components/item-form-modal"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { ImportModal } from "@/components/import-modal"
import { LoginModal } from "@/components/login-modal"
import { RoomModal } from "@/components/room-modal"
import { MasterDataModal } from "@/components/master-data-modal"
import { ReportModal } from "@/components/report-modal"
import { exportToExcel } from "@/lib/excel-utils"

type SortField = "type" | "kode" | "kategori" | "jurusan" | "namaPc" | "spesifikasi" | "repairCount" | "lokasi" | "kondisi"
type SortOrder = "asc" | "desc"

export function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>(defaultRawInventory)
  const [session, setSession] = useState<UserSession | null>(null)
  const [rooms, setRooms] = useState<string[]>([])
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [units, setUnits] = useState<UnitItem[]>([])

  // Filters
  const [itemTypeTab, setItemTypeTab] = useState<"all" | ItemType>("all")
  const [unitFilter, setUnitFilter] = useState<string>("all")
  const [kategoriFilter, setKategoriFilter] = useState<string>("all")
  const [ruanganFilter, setRuanganFilter] = useState<string>("all")
  const [kondisiFilter, setKondisiFilter] = useState<string>("all")
  const [query, setQuery] = useState("")

  // Sorting
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRoomOpen, setIsRoomOpen] = useState(false)
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Sync state on mount & listen to window events
  const loadAllMaster = () => {
    setItems(getStoredInventory())
    setSession(getStoredSession())
    setRooms(getStoredRooms())
    setCategories(getStoredCategories())
    setUnits(getStoredUnits())
  }

  useEffect(() => {
    loadAllMaster()

    // Live sync from server API so items added on other devices appear automatically
    fetch("/api/inventory")
      .then((res) => (res.ok ? res.json() : null))
      .then((serverList: InventoryItem[] | null) => {
        if (Array.isArray(serverList) && serverList.length > 0) {
          const localList = getStoredInventory()
          const map = new Map<string, InventoryItem>()
          localList.forEach((item) => map.set(item.kode, item))
          serverList.forEach((item) => map.set(item.kode, item))
          const merged = Array.from(map.values())
          setItems(merged)
          saveStoredInventory(merged)
        }
      })
      .catch(() => {})

    const handleInvUpdate = () => setItems(getStoredInventory())
    const handleAuthChange = () => setSession(getStoredSession())
    const handleRoomUpdate = () => setRooms(getStoredRooms())
    const handleMasterUpdate = () => {
      setCategories(getStoredCategories())
      setUnits(getStoredUnits())
    }

    window.addEventListener("inventory_updated", handleInvUpdate)
    window.addEventListener("auth_state_changed", handleAuthChange)
    window.addEventListener("rooms_updated", handleRoomUpdate)
    window.addEventListener("master_data_updated", handleMasterUpdate)

    return () => {
      window.removeEventListener("inventory_updated", handleInvUpdate)
      window.removeEventListener("auth_state_changed", handleAuthChange)
      window.removeEventListener("rooms_updated", handleRoomUpdate)
      window.removeEventListener("master_data_updated", handleMasterUpdate)
    }
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  const requireAdmin = (actionCallback: () => void) => {
    if (!session) {
      setIsLoginOpen(true)
      showToast("Silakan login sebagai Admin terlebih dahulu untuk melakukan aksi ini")
    } else {
      actionCallback()
    }
  }

  const requireSuperAdmin = (actionCallback: () => void) => {
    if (!session) {
      setIsLoginOpen(true)
      showToast("Aksi ini memerlukan hak akses Super Admin")
    } else if (session.role !== "superadmin") {
      showToast("Hanya Super Admin yang diizinkan melakukan aksi ini")
    } else {
      actionCallback()
    }
  }

  // Base filtered items (sebelum filter kondisi) untuk menghitung statistik kartu
  const baseFiltered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      const typeOfItem = getItemType(i)
      if (itemTypeTab !== "all" && typeOfItem !== itemTypeTab) return false
      if (unitFilter !== "all" && i.jurusan !== unitFilter) return false
      if (kategoriFilter !== "all") {
        const itemKat = getCategoryFromItem(i)
        if (itemKat !== kategoriFilter) return false
      }
      if (ruanganFilter !== "all") {
        if ((i.lokasi || "").toLowerCase() !== ruanganFilter.toLowerCase()) return false
      }
      if (!q) return true
      return [
        i.kode,
        i.namaPc,
        i.prosesor,
        i.keyboard,
        i.mouse,
        i.motherboard,
        i.os,
        i.monitor,
        i.merekModel,
        i.bahanWarna,
        i.penanggungJawab,
        i.lokasi,
        i.catatan,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [items, itemTypeTab, unitFilter, kategoriFilter, ruanganFilter, query])

  const stats = useMemo(() => getStats(baseFiltered), [baseFiltered])

  // Filtered items (termasuk filter kondisi)
  const filtered = useMemo(() => {
    if (kondisiFilter === "all") return baseFiltered
    return baseFiltered.filter((i) => kondisiStatus(i.kondisi) === kondisiFilter)
  }, [baseFiltered, kondisiFilter])

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === "asc") {
        setSortOrder("desc")
      } else {
        setSortField(null)
        setSortOrder("asc")
      }
    } else {
      setSortField(field)
      setSortOrder(field === "repairCount" ? "desc" : "asc")
    }
  }

  // Sorted items
  const sorted = useMemo(() => {
    if (!sortField) return filtered
    return [...filtered].sort((a, b) => {
      let aVal: string | number = ""
      let bVal: string | number = ""

      switch (sortField) {
        case "type":
          aVal = getItemType(a)
          bVal = getItemType(b)
          break
        case "kode":
          aVal = a.kode || ""
          bVal = b.kode || ""
          break
        case "kategori":
          aVal = getCategoryFromItem(a)
          bVal = getCategoryFromItem(b)
          break
        case "jurusan":
          aVal = a.jurusan || ""
          bVal = b.jurusan || ""
          break
        case "namaPc":
          aVal = a.namaPc || ""
          bVal = b.namaPc || ""
          break
        case "spesifikasi":
          aVal = getItemType(a) === "NON_IT" ? a.merekModel || a.bahanWarna || "" : a.prosesor || ""
          bVal = getItemType(b) === "NON_IT" ? b.merekModel || b.bahanWarna || "" : b.prosesor || ""
          break
        case "repairCount":
          aVal = a.repairLogs?.length || 0
          bVal = b.repairLogs?.length || 0
          break
        case "lokasi":
          aVal = a.lokasi || ""
          bVal = b.lokasi || ""
          break
        case "kondisi":
          aVal = kondisiStatus(a.kondisi)
          bVal = kondisiStatus(b.kondisi)
          break
      }

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal
      }
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal), "id", { numeric: true })
        : String(bVal).localeCompare(String(aVal), "id", { numeric: true })
    })
  }, [filtered, sortField, sortOrder])

  // CRUD Operations
  const handleSaveItem = async (itemToSave: InventoryItem) => {
    const isEdit = items.some((i) => i.kode === itemToSave.kode)
    let updatedList: InventoryItem[]

    if (isEdit) {
      updatedList = items.map((i) => (i.kode === itemToSave.kode ? itemToSave : i))
    } else {
      updatedList = [itemToSave, ...items]
    }

    setItems(updatedList)
    saveStoredInventory(updatedList)

    try {
      await fetch("/api/inventory", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemToSave),
      })
    } catch (e) {
      console.warn("API sync skipped or offline:", e)
    }

    showToast(isEdit ? `Barang ${itemToSave.kode} berhasil diperbarui` : `Barang ${itemToSave.kode} berhasil ditambahkan`)
  }

  const handleDeleteItem = async (itemToDelete: InventoryItem) => {
    const updatedList = items.filter((i) => i.kode !== itemToDelete.kode)
    setItems(updatedList)
    saveStoredInventory(updatedList)

    try {
      await fetch(`/api/inventory?kode=${encodeURIComponent(itemToDelete.kode)}`, {
        method: "DELETE",
      })
    } catch (e) {
      console.warn("API delete skipped:", e)
    }

    showToast(`Barang ${itemToDelete.kode} berhasil dihapus`)
  }

  const handleImportComplete = (importedItems: InventoryItem[], strategy: "merge" | "append") => {
    let updatedList: InventoryItem[]

    if (strategy === "merge") {
      const itemMap = new Map<string, InventoryItem>()
      items.forEach((i) => itemMap.set(i.kode, i))
      importedItems.forEach((i) => itemMap.set(i.kode, i))
      updatedList = Array.from(itemMap.values())
    } else {
      updatedList = [...importedItems, ...items]
    }

    setItems(updatedList)
    saveStoredInventory(updatedList)

    importedItems.forEach(async (item) => {
      try {
        await fetch("/api/inventory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
      } catch (e) {
        // ignore
      }
    })

    showToast(`Berhasil mengimpor ${importedItems.length} barang dari Excel`)
  }

  const handleExportExcel = () => {
    exportToExcel(filtered, `Inventaris-Barang-Al-Aqsyar-${new Date().toISOString().slice(0, 10)}.xlsx`)
    showToast(`Data ${filtered.length} barang berhasil diekspor ke Excel`)
  }

  const handleResetData = () => {
    requireSuperAdmin(() => {
      if (confirm("Reset data ke versi default 205 unit awal? Perubahan lokal akan dikembalikan.")) {
        setItems(defaultRawInventory)
        saveStoredInventory(defaultRawInventory)
        showToast("Data inventaris berhasil di-reset ke default")
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 shrink-0 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Status Banner */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${
              session?.role === "superadmin"
                ? "bg-purple-100 text-purple-700 border border-purple-200"
                : session
                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                : "bg-violet-100 text-violet-700 border border-violet-200"
            }`}>
              {session?.role === "superadmin" ? <ShieldAlert className="size-5" /> : session ? <UserCheck className="size-5" /> : <ShieldCheck className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {session ? session.name : "Pengunjung Sistem (Read Only)"}
                </p>
                {session && (
                  <span className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                    session.role === "superadmin"
                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                      : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                  }`}>
                    {session.role === "superadmin" ? "Super-Admin" : "Admin Staff"}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {session
                  ? session.role === "superadmin"
                    ? "Hak akses Super-Admin aktif. Anda memiliki wewenang penuh mengedit master, mengimpor, menghapus, & reset data."
                    : "Hak akses Admin aktif. Anda dapat menginput barang, mencatat perbaikan, & mengimpor data."
                  : "Anda dapat melihat data & memindai QR. Login admin/super-admin untuk mengelola data."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {session ? (
              <button
                type="button"
                onClick={() => {
                  logoutAdmin()
                  showToast("Anda telah keluar dari sesi Admin")
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="size-3.5" />
                <span>Keluar ({session.username})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
              >
                <LogIn className="size-3.5" />
                <span>Login Admin</span>
              </button>
            )}
          </div>
        </div>

        <StatCards {...stats} selectedKondisi={kondisiFilter} onSelectKondisi={setKondisiFilter} />
      </div>

      {/* ITEM TYPE TABS (Semua, Barang IT, Barang Non-IT) */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setItemTypeTab("all")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
            itemTypeTab === "all"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
          }`}
        >
          Semua Barang ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setItemTypeTab("IT")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            itemTypeTab === "IT"
              ? "bg-violet-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
          }`}
        >
          <Laptop className="size-4" />
          <span>Barang IT ({items.filter((i) => getItemType(i) === "IT").length})</span>
        </button>
        <button
          type="button"
          onClick={() => setItemTypeTab("NON_IT")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            itemTypeTab === "NON_IT"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
          }`}
        >
          <Armchair className="size-4" />
          <span>Barang Non-IT / HR-GA ({items.filter((i) => getItemType(i) === "NON_IT").length})</span>
        </button>
      </div>

      {/* Toolbar: Search, CRUD Actions & Tools */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari kode, nama, spesifikasi..."
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-violet-500 shadow-sm"
            aria-label="Cari inventaris"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 transition-all hover:bg-purple-100 shadow-xs cursor-pointer"
            title="Pusat Cetak Laporan & Rekapitulasi Aset Resmi"
          >
            <FileText className="size-3.5" />
            <span>Laporan</span>
          </button>

          <button
            type="button"
            onClick={() => requireSuperAdmin(() => setIsMasterDataOpen(true))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-700 transition-all hover:bg-purple-100 shadow-sm"
            title="Kelola Master Kategori & Master Unit (Super Admin)"
          >
            <Tags className="size-3.5" />
            <span>Master Data</span>
          </button>

          <button
            type="button"
            onClick={() => requireAdmin(() => setIsRoomOpen(true))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition-all hover:bg-violet-100 shadow-sm"
            title="Kelola & Tambah Ruangan Baru"
          >
            <Building2 className="size-3.5" />
            <span>+ Ruangan</span>
          </button>

          <button
            type="button"
            onClick={() => requireAdmin(() => setIsImportOpen(true))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-100 shadow-sm"
            title="Impor data dari file Excel"
          >
            <Upload className="size-3.5" />
            <span>Impor</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all hover:bg-slate-50 shadow-sm"
            title="Ekspor data ke file Excel .xlsx"
          >
            <Download className="size-3.5" />
            <span>Ekspor</span>
          </button>

          <button
            type="button"
            onClick={() =>
              requireAdmin(() => {
                setEditingItem(null)
                setIsFormOpen(true)
              })
            }
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-violet-700"
          >
            <Plus className="size-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 flex-wrap">
          <p>
            Menampilkan <span className="font-semibold text-foreground">{sorted.length}</span> barang / device
          </p>
          {itemTypeTab !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              Jenis: {itemTypeTab === "IT" ? "IT" : "Non-IT"}
              <button
                type="button"
                onClick={() => setItemTypeTab("all")}
                className="ml-1 hover:text-slate-950 font-black cursor-pointer"
                title="Hapus filter jenis"
              >
                &times;
              </button>
            </span>
          )}
          {kategoriFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              Kategori: {kategoriFilter}
              <button
                type="button"
                onClick={() => setKategoriFilter("all")}
                className="ml-1 hover:text-slate-950 font-black cursor-pointer"
                title="Hapus filter kategori"
              >
                &times;
              </button>
            </span>
          )}
          {unitFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              Unit: {units.find((u) => u.code === unitFilter)?.name || unitFilter}
              <button
                type="button"
                onClick={() => setUnitFilter("all")}
                className="ml-1 hover:text-slate-950 font-black cursor-pointer"
                title="Hapus filter unit"
              >
                &times;
              </button>
            </span>
          )}
          {ruanganFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              Ruangan: {ruanganFilter}
              <button
                type="button"
                onClick={() => setRuanganFilter("all")}
                className="ml-1 hover:text-slate-950 font-black cursor-pointer"
                title="Hapus filter ruangan"
              >
                &times;
              </button>
            </span>
          )}
          {kondisiFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 border border-purple-200 px-2.5 py-0.5 text-xs font-bold text-purple-800">
              Kondisi: {kondisiFilter === "baik" ? "Baik" : kondisiFilter === "bermasalah" ? "Rusak Ringan" : "Rusak Berat"}
              <button
                type="button"
                onClick={() => setKondisiFilter("all")}
                className="ml-1 hover:text-purple-950 font-black cursor-pointer"
                title="Hapus filter kondisi"
              >
                &times;
              </button>
            </span>
          )}
          {sortField && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              Urut: <strong className="capitalize">{sortField}</strong> ({sortOrder === "asc" ? "A-Z / Terendah" : "Z-A / Tertinggi"})
              <button
                type="button"
                onClick={() => setSortField(null)}
                className="ml-1 hover:text-slate-900 font-black cursor-pointer"
                title="Reset urutan"
              >
                &times;
              </button>
            </span>
          )}
          {(itemTypeTab !== "all" || kategoriFilter !== "all" || unitFilter !== "all" || ruanganFilter !== "all" || kondisiFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setItemTypeTab("all")
                setKategoriFilter("all")
                setUnitFilter("all")
                setRuanganFilter("all")
                setKondisiFilter("all")
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-600 cursor-pointer"
          title="Reset ke data default (Super-Admin)"
        >
          <RefreshCw className="size-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Table for large screens with Header Filters & Sorting */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-100/90 text-xs text-slate-700 font-semibold border-b border-border select-none">
              <tr>
                {/* 1. JENIS */}
                <th className="px-3 py-2.5 font-semibold align-top w-28">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("type")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors"
                      title="Urutkan Jenis"
                    >
                      <span>Jenis</span>
                      {sortField === "type" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                    <select
                      value={itemTypeTab}
                      onChange={(e) => setItemTypeTab(e.target.value as ItemTypeTab)}
                      className={`w-full rounded border py-1 px-1.5 text-[11px] font-medium outline-none transition-colors ${
                        itemTypeTab !== "all"
                          ? "border-purple-500 bg-purple-50 text-purple-900 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <option value="all">Semua</option>
                      <option value="IT">IT</option>
                      <option value="NON_IT">Non-IT</option>
                    </select>
                  </div>
                </th>

                {/* 2. KODE INVENTARIS */}
                <th className="px-3 py-2.5 font-semibold align-top">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("kode")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors whitespace-nowrap"
                      title="Urutkan Kode"
                    >
                      <span>Kode Inventaris</span>
                      {sortField === "kode" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  </div>
                </th>

                {/* 3. KATEGORI */}
                <th className="px-3 py-2.5 font-semibold align-top min-w-[130px]">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("kategori")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors"
                      title="Urutkan Kategori"
                    >
                      <span>Kategori</span>
                      {sortField === "kategori" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                    <select
                      value={kategoriFilter}
                      onChange={(e) => setKategoriFilter(e.target.value)}
                      className={`w-full rounded border py-1 px-1.5 text-[11px] font-medium outline-none transition-colors ${
                        kategoriFilter !== "all"
                          ? "border-purple-500 bg-purple-50 text-purple-900 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <option value="all">Semua Kategori</option>
                      {categories.map((k) => (
                        <option key={k.id} value={k.code}>
                          [{k.code}] {k.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>

                {/* 4. UNIT */}
                <th className="px-3 py-2.5 font-semibold align-top min-w-[130px]">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("jurusan")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors"
                      title="Urutkan Unit"
                    >
                      <span>Unit / Jurusan</span>
                      {sortField === "jurusan" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                    <select
                      value={unitFilter}
                      onChange={(e) => setUnitFilter(e.target.value)}
                      className={`w-full rounded border py-1 px-1.5 text-[11px] font-medium outline-none transition-colors ${
                        unitFilter !== "all"
                          ? "border-purple-500 bg-purple-50 text-purple-900 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <option value="all">Semua Unit</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.code}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>

                {/* 5. NAMA BARANG */}
                <th className="px-3 py-2.5 font-semibold align-top">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("namaPc")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors whitespace-nowrap"
                      title="Urutkan Nama Barang"
                    >
                      <span>Nama Barang</span>
                      {sortField === "namaPc" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  </div>
                </th>

                {/* 6. SPESIFIKASI */}
                <th className="px-3 py-2.5 font-semibold align-top">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("spesifikasi")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors whitespace-nowrap"
                      title="Urutkan Spesifikasi"
                    >
                      <span>Merek / Spesifikasi</span>
                      {sortField === "spesifikasi" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  </div>
                </th>

                {/* 7. RIWAYAT PERBAIKAN */}
                <th className="px-3 py-2.5 font-semibold align-top">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("repairCount")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors whitespace-nowrap"
                      title="Urutkan frekuensi perbaikan terbanyak/tersedikit"
                    >
                      <span>Perbaikan</span>
                      {sortField === "repairCount" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  </div>
                </th>

                {/* 8. LOKASI RUANGAN */}
                <th className="px-3 py-2.5 font-semibold align-top min-w-[130px]">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("lokasi")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors whitespace-nowrap"
                      title="Urutkan Ruangan"
                    >
                      <span>Lokasi Ruangan</span>
                      {sortField === "lokasi" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                    <select
                      value={ruanganFilter}
                      onChange={(e) => setRuanganFilter(e.target.value)}
                      className={`w-full rounded border py-1 px-1.5 text-[11px] font-medium outline-none transition-colors ${
                        ruanganFilter !== "all"
                          ? "border-purple-500 bg-purple-50 text-purple-900 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <option value="all">Semua Ruangan</option>
                      {rooms.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </th>

                {/* 9. KONDISI */}
                <th className="px-3 py-2.5 font-semibold align-top min-w-[120px]">
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSort("kondisi")}
                      className="flex items-center gap-1 text-slate-700 hover:text-purple-700 cursor-pointer transition-colors whitespace-nowrap"
                      title="Urutkan Kondisi"
                    >
                      <span>Kondisi</span>
                      {sortField === "kondisi" ? (
                        sortOrder === "asc" ? <ArrowUp className="size-3 text-purple-600" /> : <ArrowDown className="size-3 text-purple-600" />
                      ) : (
                        <ArrowUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                    <select
                      value={kondisiFilter}
                      onChange={(e) => setKondisiFilter(e.target.value)}
                      className={`w-full rounded border py-1 px-1.5 text-[11px] font-medium outline-none transition-colors ${
                        kondisiFilter !== "all"
                          ? "border-purple-500 bg-purple-50 text-purple-900 font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <option value="all">Semua Kondisi</option>
                      <option value="baik">Baik</option>
                      <option value="bermasalah">Rusak Ringan</option>
                      <option value="mati">Rusak Berat</option>
                    </select>
                  </div>
                </th>

                {/* 10. AKSI */}
                <th className="px-3 py-2.5 font-semibold align-top text-right min-w-[80px]">
                  <div className="flex flex-col items-end gap-1.5">
                    <span>Aksi</span>
                    {(itemTypeTab !== "all" || kategoriFilter !== "all" || unitFilter !== "all" || ruanganFilter !== "all" || kondisiFilter !== "all") && (
                      <button
                        type="button"
                        onClick={() => {
                          setItemTypeTab("all")
                          setKategoriFilter("all")
                          setUnitFilter("all")
                          setRuanganFilter("all")
                          setKondisiFilter("all")
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer whitespace-nowrap"
                        title="Reset semua filter kolom"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((item) => {
                const itemType = getItemType(item)
                const status = kondisiStatus(item.kondisi)
                const meta = kondisiMeta[status]
                const katKey = getCategoryFromItem(item)
                const repairCount = item.repairLogs ? item.repairLogs.length : 0
                return (
                  <tr key={item.kode} className="transition-colors hover:bg-violet-50/40">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          itemType === "NON_IT"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-violet-50 text-violet-700 border border-violet-200"
                        }`}
                      >
                        {itemType === "NON_IT" ? "NON-IT" : "IT"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/a/${encodeURIComponent(item.kode)}`}
                        className="hover:underline flex items-center gap-1 font-bold text-violet-700 hover:text-violet-900"
                      >
                        <span>{item.kode}</span>
                        <ExternalLink className="size-3 text-violet-400" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 font-mono text-xs font-bold text-violet-700">
                        {katKey}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.jurusan}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.namaPc || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {itemType === "NON_IT" ? item.merekModel || item.bahanWarna || "-" : item.prosesor || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <Wrench className="size-3 text-amber-600" />
                        <span>{repairCount}x</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.lokasi || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            requireAdmin(() => {
                              setEditingItem(item)
                              setIsFormOpen(true)
                            })
                          }
                          className="rounded-md p-1.5 text-slate-500 hover:bg-violet-100 hover:text-violet-700 transition-colors cursor-pointer"
                          title="Edit Barang"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requireSuperAdmin(() => setDeletingItem(item))}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Barang (Super Admin)"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cards for small screens with Edit/Delete Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {sorted.map((item) => (
          <InventoryCard
            key={item.kode}
            item={item}
            onEdit={() =>
              requireAdmin(() => {
                setEditingItem(item)
                setIsFormOpen(true)
              })
            }
            onDelete={() => requireSuperAdmin(() => setDeletingItem(item))}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground bg-card">
          Tidak ada barang yang cocok dengan pencarian / filter.
        </div>
      )}

      {/* Executive Report Center Modal (Update Poin 4) */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        items={items}
        rooms={rooms}
        categories={categories}
        units={units}
      />

      {/* Master Data Management Modal */}
      <MasterDataModal
        isOpen={isMasterDataOpen}
        onClose={() => setIsMasterDataOpen(false)}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={(sess) => {
          setSession(sess)
          showToast(`Berhasil masuk sebagai ${sess.name}`)
        }}
      />

      {/* Room Master Management Modal */}
      <RoomModal
        isOpen={isRoomOpen}
        onClose={() => setIsRoomOpen(false)}
        onRoomsUpdated={(updatedRooms) => {
          setRooms(updatedRooms)
          showToast("Daftar master ruangan berhasil diperbarui")
        }}
      />

      {/* Create & Edit Modal */}
      <ItemFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSaveItem}
        initialData={editingItem}
        existingItems={items}
      />

      {/* Import Excel Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={handleImportComplete}
        existingItems={items}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingItem)}
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={() => {
          if (deletingItem) handleDeleteItem(deletingItem)
        }}
      />
    </div>
  )
}

function InventoryCard({
  item,
  onEdit,
  onDelete,
}: {
  item: InventoryItem
  onEdit: () => void
  onDelete: () => void
}) {
  const itemType = getItemType(item)
  const status = kondisiStatus(item.kondisi)
  const meta = kondisiMeta[status]
  const katKey = getCategoryFromItem(item)
  const repairCount = item.repairLogs ? item.repairLogs.length : 0

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                itemType === "NON_IT" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-violet-50 text-violet-700 border border-violet-200"
              }`}
            >
              {itemType === "NON_IT" ? "NON-IT" : "IT"}
            </span>
            <span className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-violet-700">
              {katKey}
            </span>
            <Link href={`/a/${encodeURIComponent(item.kode)}`} className="font-mono text-xs text-violet-700 hover:text-violet-900 font-bold hover:underline flex items-center gap-1">
              <span>{item.kode}</span>
              <ExternalLink className="size-3 text-violet-400" />
            </Link>
          </div>
          <p className="mt-1 font-semibold text-foreground">{item.namaPc || "Tanpa Nama"}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        {itemType === "NON_IT" ? (
          <>
            <Spec icon={Armchair} label={item.merekModel || item.bahanWarna || "-"} />
            <Spec icon={User} label={item.penanggungJawab || "-"} />
          </>
        ) : (
          <>
            <Spec icon={Cpu} label={item.prosesor || "-"} />
            <Spec icon={MemoryStick} label={item.ram || "-"} />
            <Spec icon={HardDrive} label={item.storage || "-"} />
          </>
        )}
        <Spec icon={Wrench} label={`Perbaikan: ${repairCount}x`} />
        <Spec icon={MapPin} label={`${item.jurusan} (${item.lokasi || "-"})`} />
      </dl>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
        >
          <Pencil className="size-3.5" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="size-3.5" />
          <span>Hapus</span>
        </button>
      </div>
    </div>
  )
}

function Spec({ icon: Icon, label }: { icon: typeof Cpu; label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="size-4 shrink-0 text-muted-foreground/70" aria-hidden />
      <span className="truncate">{label || "-"}</span>
    </div>
  )
}
