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
import { exportToExcel } from "@/lib/excel-utils"

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
  const [query, setQuery] = useState("")

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [isRoomOpen, setIsRoomOpen] = useState(false)
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false)
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

  // Filtered items
  const filtered = useMemo(() => {
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

  const stats = useMemo(() => getStats(filtered), [filtered])

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
    requireAdmin(() => {
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/90 px-4 py-3 text-sm font-semibold text-emerald-300 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auth Status Banner */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-xl ${session ? "bg-emerald-500/15 text-emerald-400" : "bg-sky-500/15 text-sky-400"}`}>
              {session ? <UserCheck className="size-5" /> : <ShieldCheck className="size-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {session ? session.name : "Pengunjung Sistem (Read Only)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {session
                  ? "Akses Administrator aktif. Anda dapat mengelola Master Kategori & Unit, mengimpor, serta mengubah data."
                  : "Anda dapat melihat data inventaris IT & Non-IT. Login admin untuk mengedit data & master."}
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
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20"
              >
                <LogOut className="size-3.5" />
                <span>Keluar Admin</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLoginOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-sky-400"
              >
                <LogIn className="size-3.5" />
                <span>Login Admin</span>
              </button>
            )}
          </div>
        </div>

        <StatCards {...stats} />
      </div>

      {/* ITEM TYPE TABS (Semua, Barang IT, Barang Non-IT) */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setItemTypeTab("all")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all ${
            itemTypeTab === "all"
              ? "bg-sky-500 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          Semua Barang ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setItemTypeTab("IT")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
            itemTypeTab === "IT"
              ? "bg-sky-500 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
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
              ? "bg-amber-500 text-white shadow-md"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
          }`}
        >
          <Armchair className="size-4" />
          <span>Barang Non-IT / HR-GA ({items.filter((i) => getItemType(i) === "NON_IT").length})</span>
        </button>
      </div>

      {/* Toolbar: Filters, Search, CRUD Actions */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {/* Unit Dropdown Filter */}
          <div className="relative inline-flex items-center">
            <Building2 className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="rounded-full border border-border bg-card py-1.5 pl-8 pr-3 text-xs font-semibold text-foreground outline-none focus:border-sky-500/50"
            >
              <option value="all">Semua Unit / Jurusan</option>
              {units.map((u) => (
                <option key={u.id} value={u.code}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Dropdown Filter */}
          <div className="relative inline-flex items-center">
            <Filter className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <select
              value={kategoriFilter}
              onChange={(e) => setKategoriFilter(e.target.value)}
              className="rounded-full border border-border bg-card py-1.5 pl-8 pr-3 text-xs font-semibold text-foreground outline-none focus:border-sky-500/50"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((k) => (
                <option key={k.id} value={k.code}>
                  [{k.code}] {k.name} ({k.type})
                </option>
              ))}
            </select>
          </div>

          {/* Ruangan Dropdown Filter */}
          <div className="relative inline-flex items-center">
            <MapPin className="pointer-events-none absolute left-2.5 size-3.5 text-muted-foreground" />
            <select
              value={ruanganFilter}
              onChange={(e) => setRuanganFilter(e.target.value)}
              className="rounded-full border border-border bg-card py-1.5 pl-8 pr-3 text-xs font-semibold text-foreground outline-none focus:border-sky-500/50"
            >
              <option value="all">Semua Ruangan</option>
              {rooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-56">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, barang, spesifikasi..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-sky-500/50"
              aria-label="Cari inventaris"
            />
          </div>

          <button
            type="button"
            onClick={() => requireAdmin(() => setIsMasterDataOpen(true))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-500/20"
            title="Kelola Master Kategori & Master Unit"
          >
            <Tags className="size-3.5" />
            <span>Master Data</span>
          </button>

          <button
            type="button"
            onClick={() => requireAdmin(() => setIsRoomOpen(true))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition-all hover:bg-purple-500/20"
            title="Kelola & Tambah Ruangan Baru"
          >
            <Building2 className="size-3.5" />
            <span>+ Ruangan</span>
          </button>

          <button
            type="button"
            onClick={() => requireAdmin(() => setIsImportOpen(true))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
            title="Impor data dari file Excel"
          >
            <Upload className="size-3.5" />
            <span>Impor</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition-all hover:bg-sky-500/20"
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
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-500"
          >
            <Plus className="size-4" />
            <span>Tambah Barang</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> barang / device
        </p>
        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400"
          title="Reset ke data default"
        >
          <RefreshCw className="size-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Table for large screens with Edit/Delete Actions */}
      <div className="hidden overflow-hidden rounded-xl border border-border lg:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Jenis</th>
                <th className="px-4 py-3 font-medium">Kode Inventaris</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Nama Barang / Device</th>
                <th className="px-4 py-3 font-medium">Merek / Spesifikasi</th>
                <th className="px-4 py-3 font-medium">Lokasi Ruangan</th>
                <th className="px-4 py-3 font-medium">Kondisi</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => {
                const itemType = getItemType(item)
                const status = kondisiStatus(item.kondisi)
                const meta = kondisiMeta[status]
                const katKey = getCategoryFromItem(item)
                return (
                  <tr key={item.kode} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                          itemType === "NON_IT"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                        }`}
                      >
                        {itemType === "NON_IT" ? "NON-IT" : "IT"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-sky-300">
                      <Link
                        href={`/a/${encodeURIComponent(item.kode)}`}
                        className="hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>{item.kode}</span>
                        <ExternalLink className="size-3 text-sky-400/60" />
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 font-mono text-xs font-bold text-sky-300">
                        {katKey}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.jurusan}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.namaPc || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {itemType === "NON_IT" ? item.merekModel || item.bahanWarna || "-" : item.prosesor || "-"}
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
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-sky-500/15 hover:text-sky-400"
                          title="Edit Barang"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => requireAdmin(() => setDeletingItem(item))}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400"
                          title="Hapus Barang"
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
        {filtered.map((item) => (
          <InventoryCard
            key={item.kode}
            item={item}
            onEdit={() =>
              requireAdmin(() => {
                setEditingItem(item)
                setIsFormOpen(true)
              })
            }
            onDelete={() => requireAdmin(() => setDeletingItem(item))}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          Tidak ada barang yang cocok dengan pencarian / filter.
        </div>
      )}

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

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[10px] font-bold ${
                itemType === "NON_IT" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"
              }`}
            >
              {itemType === "NON_IT" ? "NON-IT" : "IT"}
            </span>
            <span className="rounded border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.2 font-mono text-[10px] font-bold text-sky-300">
              {katKey}
            </span>
            <Link href={`/a/${encodeURIComponent(item.kode)}`} className="font-mono text-xs text-sky-300 hover:underline flex items-center gap-1">
              <span>{item.kode}</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
          <p className="mt-1 font-medium text-foreground">{item.namaPc || "Tanpa Nama"}</p>
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
        <Spec icon={MapPin} label={`${item.jurusan} (${item.lokasi || "-"})`} />
      </dl>

      <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
        >
          <Pencil className="size-3.5 text-sky-400" />
          <span>Edit</span>
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/20"
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
