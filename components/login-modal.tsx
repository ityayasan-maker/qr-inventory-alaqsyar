"use client"

import React, { useState } from "react"
import { LogIn, X, Eye, EyeOff, ShieldCheck, KeyRound, User } from "lucide-react"
import { loginAdmin, type UserSession } from "@/lib/auth"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (session: UserSession) => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState("admin")
  const [password, setPassword] = useState("admin")
  const [showPassword, setShowPassword] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    const res = loginAdmin(username, password)
    if (res.success && res.session) {
      onSuccess(res.session)
      onClose()
    } else {
      setErrorMsg(res.message || "Gagal masuk. Periksa username & password.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative my-8 w-full max-w-md rounded-2xl border border-sky-500/30 bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
            <LogIn className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Masuk Administrator</h3>
            <p className="text-xs text-muted-foreground">Login untuk mengelola aset, cetak QR & tambah ruangan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {errorMsg && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-3 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Username / Email *</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Password *</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-10 text-sm text-foreground outline-none focus:border-sky-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-sky-500/20 bg-sky-950/30 p-3 text-xs text-sky-300 flex items-start gap-2">
            <ShieldCheck className="size-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Info Login Default System:</p>
              <p className="text-[11px] text-sky-300/80">Username: <code className="font-mono font-bold text-sky-200">admin</code> | Password: <code className="font-mono font-bold text-sky-200">admin</code></p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
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
              <LogIn className="size-4" />
              <span>Masuk Sekarang</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
