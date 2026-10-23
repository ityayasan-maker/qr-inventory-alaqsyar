"use client"

import React, { useState, useEffect } from "react"
import { Tags, Building2, Plus, Check, X, ToggleLeft, ToggleRight, Trash2 } from "lucide-react"
import {
  getStoredCategories,
  saveStoredCategories,
  getStoredUnits,
  saveStoredUnits,
  type CategoryItem,
  type UnitItem,
} from "@/lib/master-data"

interface MasterDataModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MasterDataModal({ isOpen, onClose }: MasterDataModalProps) {
  const [tab, setTab] = useState<"categories" | "units">("categories")
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [units, setUnits] = useState<UnitItem[]>([])

  // New Category Form State
  const [newCatCode, setNewCatCode] = useState("")
  const [newCatName, setNewCatName] = useState("")
  const [newCatType, setNewCatType] = useState<"IT" | "NON_IT">("NON_IT")

  // New Unit Form State
  const [newUnitCode, setNewUnitCode] = useState("")
  const [newUnitName, setNewUnitName] = useState("")

  useEffect(() => {
    if (isOpen) {
      setCategories(getStoredCategories())
      setUnits(getStoredUnits())
    }
  }, [isOpen])

  if (!isOpen) return null

  // Category Operations
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    const code = (newCatCode.trim() || newCatName.trim().slice(0, 4)).toUpperCase()
    const newCat: CategoryItem = {
      id: `cat-${Date.now()}`,
      code,
      name: newCatName.trim(),
      type: newCatType,
      active: true,
    }
    const updated = [...categories, newCat]
    setCategories(updated)
    saveStoredCategories(updated)
    setNewCatCode("")
    setNewCatName("")
  }

  const handleToggleCategory = (id: string) => {
    const updated = categories.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    setCategories(updated)
    saveStoredCategories(updated)
  }

  const handleDeleteCategory = (id: string) => {
    if (confirm("Hapus kategori barang ini?")) {
      const updated = categories.filter((c) => c.id !== id)
      setCategories(updated)
      saveStoredCategories(updated)
    }
  }

  // Unit Operations
  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUnitName.trim()) return
    const code = (newUnitCode.trim() || newUnitName.trim().slice(0, 6)).toUpperCase()
    const newUnit: UnitItem = {
      id: `unit-${Date.now()}`,
      code,
      name: newUnitName.trim(),
      active: true,
    }
    const updated = [...units, newUnit]
    setUnits(updated)
    saveStoredUnits(updated)
    setNewUnitCode("")
    setNewUnitName("")
  }

  const handleToggleUnit = (id: string) => {
    const updated = units.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    setUnits(updated)
    saveStoredUnits(updated)
  }

  const handleDeleteUnit = (id: string) => {
    if (confirm("Hapus unit/jurusan ini?")) {
      const updated = units.filter((u) => u.id !== id)
      setUnits(updated)
      saveStoredUnits(updated)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-violet-200 bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Tags className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Pengaturan Master Data Sistem</h3>
            <p className="text-xs text-muted-foreground">Kelola Kategori Barang (IT & Non-IT) serta daftar Jurusan/Unit Pemilik</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-6 flex border-b border-border">
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "categories"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Tags className="size-4" />
            <span>Master Kategori Barang</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("units")}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === "units"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="size-4" />
            <span>Master Jurusan & Unit</span>
          </button>
        </div>

        {/* Tab Content: Kategori */}
        {tab === "categories" && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              <input
                type="text"
                value={newCatCode}
                onChange={(e) => setNewCatCode(e.target.value)}
                className="font-mono text-xs font-bold rounded-lg border border-border bg-background px-3 py-2 text-violet-700 outline-none focus:border-violet-500"
                placeholder="Kode (ex: MEJA)"
              />
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet-500"
                placeholder="Nama Kategori Barang"
                required
              />
              <select
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as "IT" | "NON_IT")}
                className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-violet-500"
              >
                <option value="NON_IT">Barang Non-IT (HR/GA)</option>
                <option value="IT">Barang IT</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
              >
                <Plus className="size-4" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-slate-50/50 p-2 space-y-1">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className={`flex items-center justify-between rounded-lg p-2.5 text-sm transition-colors ${
                    c.active ? "bg-card text-foreground border border-border/50" : "bg-muted/30 text-muted-foreground opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-violet-700">[{c.code}]</span>
                    <span className="font-medium">{c.name}</span>
                    <span
                      className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        c.type === "IT" ? "bg-violet-50 text-violet-700 border border-violet-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {c.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleCategory(c.id)}
                      className="text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      title={c.active ? "Nonaktifkan kategori" : "Aktifkan kategori"}
                    >
                      {c.active ? (
                        <ToggleRight className="size-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="size-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content: Units */}
        {tab === "units" && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleAddUnit} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={newUnitCode}
                onChange={(e) => setNewUnitCode(e.target.value)}
                className="font-mono text-xs font-bold rounded-lg border border-border bg-background px-3 py-2 text-violet-700 outline-none focus:border-violet-500"
                placeholder="Kode (ex: KEUANGAN)"
              />
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-violet-500"
                placeholder="Nama Unit / Jurusan"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
              >
                <Plus className="size-4" />
                <span>Tambah Unit</span>
              </button>
            </form>

            <div className="max-h-64 overflow-y-auto rounded-xl border border-border bg-slate-50/50 p-2 space-y-1">
              {units.map((u) => (
                <div
                  key={u.id}
                  className={`flex items-center justify-between rounded-lg p-2.5 text-sm transition-colors ${
                    u.active ? "bg-card text-foreground border border-border/50" : "bg-muted/30 text-muted-foreground opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-violet-700">[{u.code}]</span>
                    <span className="font-medium">{u.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleUnit(u.id)}
                      className="text-xs font-medium flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      title={u.active ? "Nonaktifkan unit" : "Aktifkan unit"}
                    >
                      {u.active ? (
                        <ToggleRight className="size-5 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="size-5 text-slate-400" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUnit(u.id)}
                      className="rounded p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 transition-colors"
          >
            <Check className="size-4" />
            <span>Selesai</span>
          </button>
        </div>
      </div>
    </div>
  )
}
