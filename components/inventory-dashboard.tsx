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
  FileSpreadsheet,
  Download,
  Upload,
} from "lucide-react"
import {
  inventory as defaultRawInventory,
  JURUSAN,
  getStats,
  kondisiStatus,
  kondisiMeta,
  getStoredInventory,
  saveStoredInventory,
  type InventoryItem,
} from "@/lib/inventory"
import { StatCards } from "@/components/stat-cards"
import { ItemFormModal } from "@/components/item-form-modal"
import { DeleteConfirmModal } from "@/components/delete-confirm-modal"
import { ImportModal } from "@/components/import-modal"
import { exportToExcel } from "@/lib/excel-utils"

const FILTERS = [
  { key: "all", label: "Semua" },
  ...JURUSAN.map((j) => ({ key: j.key, label: j.label })),
] as const

export function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>(defaultRawInventory)
  const [jurusan, setJurusan] = useState<string>("all")
  const [query, setQuery] = useState("")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Sync with localStorage on mount & listen to window events
  useEffect(() => {
    const loaded = getStoredInventory()
    setItems(loaded)

    const handleUpdate = () => {
      setItems(getStoredInventory())
    }
    window.addEventListener("inventory_updated", handleUpdate)
    return () => window.removeEventListener("inventory_updated", handleUpdate)
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Filtered items
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items.filter((i) => {
      if (jurusan !== "all" && i.jurusan !== jurusan) return false
      if (!q) return true
      return [i.kode, i.namaPc, i.prosesor, i.motherboard, i.os, i.monitor, i.casing, i.lokasi]
        .join(" ")
        .toLowerCase()
        .includes(q)
    })
  }, [items, jurusan, query])

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

    // Sync with API route (background attempt)
    try {
      await fetch("/api/inventory", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemToSave),
      })
    } catch (e) {
      console.warn("API sync skipped or offline:", e)
    }

    showToast(isEdit ? `Unit ${itemToSave.kode} berhasil diperbarui` : `Unit ${itemToSave.kode} berhasil ditambahkan`)
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

    showToast(`Unit ${itemToDelete.kode} berhasil dihapus`)
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

    // Background sync each imported item to API
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

    showToast(`Berhasil mengimpor ${importedItems.length} unit komputer dari Excel`)
  }

  const handleExportExcel = () => {
    exportToExcel(filtered, `Inventaris-Komputer-Al-Aqsyar-${new Date().toISOString().slice(0, 10)}.xlsx`)
    showToast(`Data ${filtered.length} unit berhasil diekspor ke Excel`)
  }

  const handleResetData = () => {
    if (confirm("Reset data ke versi default 193 unit awal? Perubahan lokal akan dikembalikan.")) {
      setItems(defaultRawInventory)
      saveStoredInventory(defaultRawInventory)
      showToast("Data inventaris berhasil di-reset ke default")
    }
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

      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatCards {...stats} />
      </div>

      {/* Toolbar: Filter, Search, CRUD Actions, Import/Export */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = jurusan === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setJurusan(f.key)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-sky-500/50 bg-sky-500/15 text-sky-300"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                {f.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari kode, prosesor, motherboard..."
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-sky-500/50"
              aria-label="Cari inventaris"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
            title="Impor data dari file Excel"
          >
            <Upload className="size-3.5" />
            <span>Impor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-300 transition-all hover:bg-sky-500/20"
            title="Ekspor data ke file Excel .xlsx"
          >
            <Download className="size-3.5" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null)
              setIsFormOpen(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-emerald-500"
          >
            <Plus className="size-4" />
            <span>Tambah Unit</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> unit
        </p>
        <button
          type="button"
          onClick={handleResetData}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-rose-400"
          title="Reset ke data default 193 unit"
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
                <th className="px-4 py-3 font-medium">Kode Aset</th>
                <th className="px-4 py-3 font-medium">Jurusan</th>
                <th className="px-4 py-3 font-medium">Nama PC</th>
                <th className="px-4 py-3 font-medium">Prosesor</th>
                <th className="px-4 py-3 font-medium">RAM</th>
                <th className="px-4 py-3 font-medium">Storage</th>
                <th className="px-4 py-3 font-medium">Monitor</th>
                <th className="px-4 py-3 font-medium">Kondisi</th>
                <th className="px-4 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => {
                const status = kondisiStatus(item.kondisi)
                const meta = kondisiMeta[status]
                return (
                  <tr key={item.kode} className="transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs text-sky-300">
                      <Link
                        href={`/a/${encodeURIComponent(item.kode)}`}
                        className="hover:underline flex items-center gap-1"
                      >
                        <span>{item.kode}</span>
                        <ExternalLink className="size-3 text-sky-400/60" />
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.jurusan}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{item.namaPc || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.prosesor || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.ram || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.storage || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.monitor || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item)
                            setIsFormOpen(true)
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-sky-500/15 hover:text-sky-400"
                          title="Edit Unit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingItem(item)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-400"
                          title="Hapus Unit"
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
            onEdit={() => {
              setEditingItem(item)
              setIsFormOpen(true)
            }}
            onDelete={() => setDeletingItem(item)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
          Tidak ada unit yang cocok dengan pencarian.
        </div>
      )}

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
  const status = kondisiStatus(item.kondisi)
  const meta = kondisiMeta[status]
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Link href={`/a/${encodeURIComponent(item.kode)}`} className="font-mono text-xs text-sky-300 hover:underline flex items-center gap-1">
            <span>{item.kode}</span>
            <ExternalLink className="size-3" />
          </Link>
          <p className="mt-0.5 font-medium text-foreground">{item.namaPc || "Tanpa Nama"}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${meta.className}`}>
          {meta.label}
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <Spec icon={Cpu} label={item.prosesor} />
        <Spec icon={MemoryStick} label={item.ram} />
        <Spec icon={HardDrive} label={item.storage} />
        <Spec icon={MapPin} label={item.jurusan} />
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
