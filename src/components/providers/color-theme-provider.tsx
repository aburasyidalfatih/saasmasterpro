"use client"

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { defaultThemeId } from "@/lib/themes"

interface ColorThemeContextType {
  colorTheme: string
  previewTheme: string
  previewColorTheme: (theme: string) => void
  saveColorTheme: (theme: string) => Promise<boolean>
  resetPreview: () => void
  hasUnsavedChanges: boolean
  activeTenantId: string | null
}

const ColorThemeContext = createContext<ColorThemeContextType>({
  colorTheme: defaultThemeId,
  previewTheme: defaultThemeId,
  previewColorTheme: () => {},
  saveColorTheme: async () => false,
  resetPreview: () => {},
  hasUnsavedChanges: false,
  activeTenantId: null,
})

function applyThemeToDOM(theme: string) {
  document.documentElement.setAttribute("data-theme", theme)
}

function setThemeCookie(theme: string) {
  document.cookie = `color-theme=${theme};path=/;max-age=${365 * 86400};SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"))
  return match ? decodeURIComponent(match[2]) : null
}

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update: updateSession } = useSession()
  const [savedTheme, setSavedTheme] = useState(defaultThemeId)
  const [previewTheme, setPreviewTheme] = useState(defaultThemeId)
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null)
  const lastFetchedRef = useRef<string | null>(null)

  // Detect if we're in super admin panel (not impersonating)
  const isSuperAdminPanel = typeof window !== "undefined" && window.location.pathname.startsWith("/super-admin")
  const isImpersonating = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const isSuperAdminOnly = session?.user?.isSuperAdmin && !isImpersonating

  // Resolve tenant ID from session OR impersonate cookie
  useEffect(() => {
    // Super admin not impersonating → no tenant theme, use default
    if (isSuperAdminOnly) {
      setSavedTheme(defaultThemeId)
      setPreviewTheme(defaultThemeId)
      applyThemeToDOM(defaultThemeId)
      return
    }

    const sessionTenantId = session?.user?.tenants?.[0]?.id

    if (sessionTenantId) {
      setResolvedTenantId(sessionTenantId)
      return
    }

    // Fallback: impersonate mode — resolve slug from cookie
    const impersonateSlug = getCookie("impersonate-tenant")
    if (impersonateSlug) {
      fetch(`/api/tenant/by-slug?slug=${impersonateSlug}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.id) setResolvedTenantId(data.id)
        })
        .catch(() => {})
    }
  }, [session?.user?.tenants, isSuperAdminOnly])

  // Fetch theme from database when tenantId is resolved
  useEffect(() => {
    if (!resolvedTenantId) return
    if (lastFetchedRef.current === resolvedTenantId) return
    lastFetchedRef.current = resolvedTenantId

    fetch(`/api/tenant/theme/current?tenantId=${resolvedTenantId}`)
      .then((r) => r.json())
      .then((data) => {
        const theme = data.theme || defaultThemeId
        setSavedTheme(theme)
        setPreviewTheme(theme)
        applyThemeToDOM(theme)
        setThemeCookie(theme)
      })
      .catch(() => {})
  }, [resolvedTenantId])

  // Periodic sync (every 60s)
  useEffect(() => {
    if (!resolvedTenantId) return
    const interval = setInterval(() => {
      if (previewTheme !== savedTheme) return
      fetch(`/api/tenant/theme/current?tenantId=${resolvedTenantId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.theme && data.theme !== savedTheme) {
            setSavedTheme(data.theme)
            setPreviewTheme(data.theme)
            applyThemeToDOM(data.theme)
            setThemeCookie(data.theme)
          }
        })
        .catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [resolvedTenantId, savedTheme, previewTheme])

  const previewColorTheme = useCallback((theme: string) => {
    setPreviewTheme(theme)
    applyThemeToDOM(theme)
  }, [])

  const saveColorTheme = useCallback(async (theme: string): Promise<boolean> => {
    if (!resolvedTenantId) return false
    try {
      const res = await fetch("/api/tenant/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: resolvedTenantId, theme }),
      })
      if (!res.ok) return false
      setSavedTheme(theme)
      setPreviewTheme(theme)
      applyThemeToDOM(theme)
      setThemeCookie(theme)
      await updateSession()
      return true
    } catch {
      return false
    }
  }, [resolvedTenantId, updateSession])

  const resetPreview = useCallback(() => {
    setPreviewTheme(savedTheme)
    applyThemeToDOM(savedTheme)
  }, [savedTheme])

  const hasUnsavedChanges = previewTheme !== savedTheme

  const value = useMemo(
    () => ({
      colorTheme: savedTheme,
      previewTheme,
      previewColorTheme,
      saveColorTheme,
      resetPreview,
      hasUnsavedChanges,
      activeTenantId: resolvedTenantId,
    }),
    [savedTheme, previewTheme, previewColorTheme, saveColorTheme, resetPreview, hasUnsavedChanges, resolvedTenantId]
  )

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme() {
  return useContext(ColorThemeContext)
}
