"use client"

import React from "react"
import { AlertTriangle, Trash2, X } from "lucide-react"
import type { InventoryItem } from "@/lib/inventory"

interface DeleteConfirmModalProps {
  isOpen: boolean
  item: InventoryItem | null
  onClose: () => void
  onConfirm: () => void
}

export function DeleteConfirmModal({
  isOpen,
  item,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!isOpen || !item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-rose-200 bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-slate-100 hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Hapus Barang</h3>
            <p className="text-xs text-muted-foreground">Konfirmasi tindakan penghapusan data</p>
          </div>
        </div>

        <div className="my-4 rounded-xl border border-border bg-slate-50 p-4 font-mono text-sm">
          <p className="text-xs text-muted-foreground font-sans">Kode Aset:</p>
          <p className="font-bold text-violet-700">{item.kode}</p>
          <p className="mt-2 text-xs text-muted-foreground font-sans">Nama Barang / Spesifikasi:</p>
          <p className="text-xs font-semibold text-foreground font-sans">
            {item.namaPc || "Tanpa Nama"} &middot; {item.prosesor || item.merekModel || "-"} &middot; {item.jurusan}
          </p>
        </div>

        <p className="text-xs text-rose-600 font-medium">
          Apakah Anda yakin ingin menghapus data inventaris ini dari sistem?
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-slate-50 hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-rose-700"
          >
            <Trash2 className="size-4" />
            <span>Ya, Hapus Barang</span>
          </button>
        </div>
      </div>
    </div>
  )
}
