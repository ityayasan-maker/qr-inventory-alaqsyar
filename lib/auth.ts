"use client"

export interface UserSession {
  username: string
  name: string
  role: "superadmin" | "admin"
  loggedInAt: number
}

const AUTH_KEY = "qr_inventory_auth_v1"

export function getStoredSession(): UserSession | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) {
      return JSON.parse(raw) as UserSession
    }
  } catch (e) {
    console.error("Failed to read auth session", e)
  }
  return null
}

export function loginAdmin(usernameInput: string, passwordInput: string): { success: boolean; message?: string; session?: UserSession } {
  const cleanUser = usernameInput.trim().toLowerCase()
  const cleanPass = passwordInput.trim()

  // 1. Super-Admin Access
  if (cleanUser === "superadmin" && cleanPass === "ITYAYASAN1999") {
    const session: UserSession = {
      username: "superadmin",
      name: "Super Admin Al-Aqsyar",
      role: "superadmin",
      loggedInAt: Date.now(),
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      window.dispatchEvent(new Event("auth_state_changed"))
    }
    return { success: true, session }
  }

  // 2. Admin Biasa Access (supports AQSYAR1999 or ITYAYASAN1999 for flexibility)
  if ((cleanUser === "admin" || cleanUser === "admin@alaqsyar.sch.id") && (cleanPass === "AQSYAR1999" || cleanPass === "ITYAYASAN1999")) {
    const session: UserSession = {
      username: "admin",
      name: "Admin Staff IT/GA",
      role: "admin",
      loggedInAt: Date.now(),
    }
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session))
      window.dispatchEvent(new Event("auth_state_changed"))
    }
    return { success: true, session }
  }

  return { success: false, message: "Username atau password salah." }
}

export function logoutAdmin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY)
    window.dispatchEvent(new Event("auth_state_changed"))
  }
}
