"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useColorTheme } from "@/components/providers/color-theme-provider"
import { themes } from "@/lib/themes"
import { Check, Sun, Moon, Monitor, Palette, Info, Save, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const themePreviewColors: Record<string, { from: string; to: string }> = {
  corporate: { from: "from-blue-700", to: "to-blue-900" },
  ocean: { from: "from-cyan-500", to: "to-teal-600" },
  emerald: { from: "from-emerald-500", to: "to-green-600" },
  sunset: { from: "from-orange-500", to: "to-rose-500" },
  aurora: { from: "from-violet-500", to: "to-purple-600" },
  cyberpunk: { from: "from-cyan-400", to: "to-fuchsia-500" },
  midnight: { from: "from-blue-600", to: "to-indigo-800" },
  hologram: { from: "from-cyan-400", to: "to-pink-500" },
}

const categoryLabels: Record<string, string> = {
  formal: "🏢 Formal & Profesional",
  modern: "✨ Modern & Elegan",
  creative: "🎨 Kreatif & Dinamis",
  futuristic: "⚡ Futuristik & Canggih",
}

export default function AppearancePage() {
  const { theme: darkMode, setTheme: setDarkMode } = useTheme()
  const { colorTheme, previewTheme, previewColorTheme, saveColorTheme, resetPreview, hasUnsavedChanges, activeTenantId } = useColorTheme()
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)

  const activeTenant = session?.user?.tenants?.find((t) => t.id === activeTenantId) || session?.user?.tenants?.[0]
  const isImpersonating = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  // Super admin murni (tidak impersonate) TIDAK bisa ubah tema tenant
  // Hanya owner/admin tenant yang bisa ubah tema dashboard mereka
  const canChangeTheme = activeTenant?.role === "owner" || activeTenant?.role === "admin" || isImpersonating
  const isSuperAdminOnly = session?.user?.isSuperAdmin && !isImpersonating

  const handleSave = async () => {
    setSaving(true)
    let tenantId = activeTenantId || session?.user?.tenants?.[0]?.id

    // Fallback 1: fetch session langsung
    if (!tenantId) {
      try {
        const sessionRes = await fetch("/api/auth/session")
        const sessionData = await sessionRes.json()
        tenantId = sessionData?.user?.tenants?.[0]?.id
      } catch {}
    }

    // Fallback 2: impersonate mode — ambil dari cookie slug
    if (!tenantId) {
      const slugMatch = document.cookie.match(/impersonate-tenant=([^;]+)/)
      const slug = slugMatch?.[1]
      if (slug) {
        try {
          const tenantRes = await fetch(`/api/tenant/by-slug?slug=${slug}`)
          const tenantData = await tenantRes.json()
          tenantId = tenantData?.id
        } catch {}
      }
    }

    if (!tenantId) {
      setSaving(false)
      toast({ title: "Gagal menyimpan", description: "Tenant tidak ditemukan. Coba refresh halaman.", variant: "destructive" })
      return
    }

    try {
      const res = await fetch("/api/tenant/theme", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, theme: previewTheme }),
      })
      setSaving(false)
      if (res.ok) {
        toast({ title: "Tema disimpan", description: `Tema ${themes.find(t => t.id === previewTheme)?.name} diterapkan untuk semua pengguna.` })
        window.location.reload()
      } else {
        const data = await res.json().catch(() => ({}))
        toast({ title: "Gagal menyimpan", description: data.error || "Terjadi kesalahan saat menyimpan tema.", variant: "destructive" })
      }
    } catch {
      setSaving(false)
      toast({ title: "Gagal menyimpan", description: "Tidak dapat terhubung ke server.", variant: "destructive" })
    }
  }

  const groupedThemes = themes.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = []
    acc[t.category].push(t)
    return acc
  }, {} as Record<string, typeof themes>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tampilan & Tema</h1>
          <p className="text-muted-foreground mt-1">Sesuaikan tampilan aplikasi sesuai selera Anda.</p>
        </div>
        {/* Tombol Simpan — sticky di atas */}
        {canChangeTheme && hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-xl gap-2" onClick={resetPreview}>
              <RotateCcw className="h-4 w-4" />
              Batal
            </Button>
            <Button className="rounded-xl gap-2 btn-gradient text-white border-0" onClick={handleSave} disabled={saving}>
              {saving ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan Tema
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <Card className="glass border-0 lg:col-span-2">
          <CardContent className="flex items-start gap-3 p-4">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Tema berlaku untuk seluruh organisasi</p>
              <p className="text-muted-foreground mt-0.5">
                {isSuperAdminOnly
                  ? "Anda login sebagai Super Admin. Untuk mengubah tema tenant, gunakan fitur \"Login Sebagai\" dari halaman Tenant."
                  : canChangeTheme
                  ? "Pilih tema lalu klik \"Simpan Tema\" untuk menerapkan ke semua pengguna di organisasi ini."
                  : "Hanya Owner dan Admin yang dapat mengubah tema organisasi."}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mode Tampilan */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Sun className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Mode Tampilan</CardTitle>
                <CardDescription>Terang, gelap, atau ikuti sistem</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "light", label: "Terang", icon: Sun, desc: "Cerah" },
                { id: "dark", label: "Gelap", icon: Moon, desc: "Gelap" },
                { id: "system", label: "Sistem", icon: Monitor, desc: "Auto" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setDarkMode(mode.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200",
                    darkMode === mode.id
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-transparent bg-muted/50 hover:bg-muted"
                  )}
                >
                  <mode.icon className={cn("h-6 w-6", darkMode === mode.id ? "text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-sm font-semibold", darkMode === mode.id ? "text-primary" : "text-foreground")}>{mode.label}</span>
                  <span className="text-[11px] text-muted-foreground">{mode.desc}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Preview Tema</CardTitle>
                <CardDescription>
                  {hasUnsavedChanges
                    ? "Anda sedang melihat preview — klik Simpan untuk menerapkan"
                    : "Tampilan tema yang sedang aktif"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <div className="h-3 btn-gradient" />
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl btn-gradient" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-2/3 rounded bg-foreground/10" />
                    <div className="h-2 w-1/2 rounded bg-muted-foreground/10" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-16 rounded-lg bg-primary/10" />
                  <div className="h-16 rounded-lg bg-accent" />
                  <div className="h-16 rounded-lg bg-muted" />
                </div>
                <div className="flex gap-2">
                  <div className="h-8 flex-1 rounded-lg btn-gradient" />
                  <div className="h-8 flex-1 rounded-lg border bg-background" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              {hasUnsavedChanges ? (
                <>Preview: <span className="font-semibold text-amber-600">{themes.find(t => t.id === previewTheme)?.name}</span> (belum disimpan)</>
              ) : (
                <>Tema aktif: <span className="font-semibold text-primary">{themes.find(t => t.id === colorTheme)?.name || colorTheme}</span></>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Tema Warna */}
        {Object.entries(groupedThemes).map(([category, categoryThemes]) => (
          <Card key={category} className="glass border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {categoryLabels[category]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {categoryThemes.map((t) => {
                const isSelected = previewTheme === t.id
                const isSaved = colorTheme === t.id
                const colors = themePreviewColors[t.id]
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (!canChangeTheme) {
                        toast({ title: "Tidak punya izin", description: "Hanya Owner/Admin yang dapat mengubah tema.", variant: "destructive" })
                        return
                      }
                      previewColorTheme(t.id)
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-sm",
                      colors?.from, colors?.to
                    )}>
                      {isSelected ? <Check className="h-4 w-4 text-white" /> : <span>{t.preview}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>{t.name}</span>
                        {isSaved && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Tersimpan</span>}
                        {isSelected && !isSaved && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">Preview</span>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        ))}

        {/* Tombol simpan di bawah juga (untuk mobile) */}
        {canChangeTheme && hasUnsavedChanges && (
          <Card className="glass border-0 lg:col-span-2">
            <CardContent className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">
                Anda memilih tema <span className="font-semibold text-foreground">{themes.find(t => t.id === previewTheme)?.name}</span> — simpan untuk menerapkan.
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-xl" onClick={resetPreview}>Batal</Button>
                <Button size="sm" className="rounded-xl btn-gradient text-white border-0 gap-2" onClick={handleSave} disabled={saving}>
                  {saving ? <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3 w-3" />}
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
