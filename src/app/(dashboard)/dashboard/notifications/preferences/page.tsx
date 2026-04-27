"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Halaman ini digabungkan ke /dashboard/settings
 * Redirect otomatis agar link lama tetap berfungsi.
 */
export default function NotificationPreferencesRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/settings")
  }, [router])
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
