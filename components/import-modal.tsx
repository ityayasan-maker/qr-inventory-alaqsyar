"use client"

import React, { useState } from "react"
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from "lucide-react"
import { parseExcelFile, downloadTemplateExcel } from "@/lib/excel-utils"
import type { InventoryItem } from "@/lib/inventory"

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: (items: InventoryItem[], strategy: "merge" | "append") => void
  existingItems: InventoryItem[]
}

export function ImportModal({
  isOpen,
  onClose,
  onImportComplete,
  existingItems,
}: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<InventoryItem[]>([])
  const [strategy, setStrategy] = useState<"merge" | "append">("merge")
  const [busy, setBusy] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setErrorMsg(null)
    setBusy(true)
    try {
      const rows = await parseExcelFile(selectedFile, existingItems)
      setParsedRows(rows)
    } catch (err: any) {
      console.error("Gagal membaca file Excel:", err)
      setErrorMsg("Gagal membaca file Excel. Pastikan format file .xlsx/.xls valid.")
      setParsedRows([])
    } finally {
      setBusy(false)
    }
  }

  const handleCommit = () => {
    if (parsedRows.length === 0) return
    onImportComplete(parsedRows, strategy)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setFile(null)
    setParsedRows([])
    setErrorMsg(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-3xl rounded-2xl border border-border bg-card shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <FileSpreadsheet className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Impor Data Inventaris Excel</h2>
              <p className="text-xs text-muted-foreground">Upload file .xlsx untuk memasukkan data komputer secara masal</p>
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
        <div className="p-6 space-y-6">
          {/* Download Template Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-4">
            <div>
              <p className="text-sm font-semibold text-emerald-300">Belum punya format Excel?</p>
              <p className="text-xs text-emerald-400/80">Unduh template standar dengan header kolom yang sesuai</p>
            </div>
            <button
              type="button"
              onClick={downloadTemplateExcel}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md hover:bg-emerald-500"
            >
              <Download className="size-4" />
              <span>Unduh Template Excel</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Pilih File Spreadsheet (.xlsx / .xls)
            </label>
            <div className="relative flex min-h-36 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-background p-6 text-center transition-colors hover:border-emerald-500/50">
              <Upload className="size-8 text-emerald-400/70 mb-2" />
              <p className="text-sm font-medium text-foreground">
                {file ? file.name : "Klik atau seret file Excel ke sini"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Format didukung: .xlsx, .xls, .csv</p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              <AlertCircle className="size-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  Preview Import: <span className="text-emerald-400">{parsedRows.length} unit</span> terdeteksi
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <label htmlFor="strategySelect" className="font-semibold">Penanganan Duplikat Kode:</label>
                  <select
                    id="strategySelect"
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as "merge" | "append")}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground outline-none"
                  >
                    <option value="merge">Perbarui jika kode sudah ada</option>
                    <option value="append">Selalu tambah baru</option>
                  </select>
                </div>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-border bg-background">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2">Kode Aset</th>
                      <th className="px-3 py-2">Jurusan</th>
                      <th className="px-3 py-2">Nama PC</th>
                      <th className="px-3 py-2">Prosesor</th>
                      <th className="px-3 py-2">RAM</th>
                      <th className="px-3 py-2">Storage</th>
                      <th className="px-3 py-2">Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {parsedRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-muted/30">
                        <td className="px-3 py-2 font-mono font-bold text-sky-400">{row.kode}</td>
                        <td className="px-3 py-2 text-foreground">{row.jurusan}</td>
                        <td className="px-3 py-2 text-foreground">{row.namaPc || "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.prosesor || "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.ram || "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.storage || "-"}</td>
                        <td className="px-3 py-2 text-muted-foreground">{row.lokasi || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleCommit}
            disabled={parsedRows.length === 0 || busy}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="size-4" />
            <span>Impor {parsedRows.length > 0 ? `${parsedRows.length} Data` : "Sekarang"}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
