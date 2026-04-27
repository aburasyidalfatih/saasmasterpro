"use client"

/**
 * TenantBrandingProvider
 *
 * Menyimpan nama dan logo tenant di React Context sehingga bisa
 * di-update secara instan tanpa menunggu JWT refresh.
 *
 * Sidebar dan komponen lain membaca dari context ini, bukan dari session.
 * Settings page memanggil updateBranding() setelah simpan.
 */

import { createContext, useContext, useEffect, useState } from "react"
import { useSession } from "next-auth/react"

interface TenantBranding {
  name: string
  logo: string | null
}

interface TenantBrandingContextValue {
  branding: TenantBranding
  updateBranding: (data: Partial<TenantBranding>) => void
}

const TenantBrandingContext = createContext<TenantBrandingContextValue>({
  branding: { name: "SaasMasterPro", logo: null },
  updateBranding: () => {},
})

export function TenantBrandingProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()

  const [branding, setBranding] = useState<TenantBranding>({
    name: "SaasMasterPro",
    logo: null,
  })

  // Inisialisasi dari session saat pertama load
  useEffect(() => {
    const tenant = session?.user?.tenants?.[0]
    if (tenant) {
      setBranding({
        name: tenant.name || "SaasMasterPro",
        logo: (tenant as any).logo || null,
      })
    }
  }, [session?.user?.tenants])

  const updateBranding = (data: Partial<TenantBranding>) => {
    setBranding((prev) => ({ ...prev, ...data }))
  }

  return (
    <TenantBrandingContext.Provider value={{ branding, updateBranding }}>
      {children}
    </TenantBrandingContext.Provider>
  )
}

export function useTenantBranding() {
  return useContext(TenantBrandingContext)
}
