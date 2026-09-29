"use client"

export interface UserSession {
  username: string
  name: string
  role: "superadmin" | "admin" | "staff"
  loggedInAt: number
}

const AUTH_KEY = "qr_inventory_auth_v1"

export const DEFAULT_ADMIN = {
  username: "admin",
  password: "admin",
  name: "Super Admin Al-Aqsyar",
}

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

  if ((cleanUser === "admin" || cleanUser === "admin@alaqsyar.sch.id") && cleanPass === "admin") {
    const session: UserSession = {
      username: "admin",
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

  return { success: false, message: "Username atau password salah. (Default: admin / admin)" }
}

export function logoutAdmin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_KEY)
    window.dispatchEvent(new Event("auth_state_changed"))
  }
}
