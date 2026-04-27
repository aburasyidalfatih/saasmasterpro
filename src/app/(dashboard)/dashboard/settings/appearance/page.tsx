"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useColorTheme } from "@/components/providers/color-theme-provider"
import { themes } from "@/lib/themes"
import { Check, Sun, Moon, Monitor, Palette, Info, Save, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const themeGradients: Record<string, string> = {
  corporate: "from-blue-700 to-blue-900",
  ocean:     "from-cyan-500 to-teal-600",
  emerald:   "from-emerald-500 to-green-600",
  sunset:    "from-orange-500 to-rose-500",
  aurora:    "from-violet-500 to-purple-600",
  cyberpunk: "from-cyan-400 to-fuchsia-500",
  midnight:  "from-blue-600 to-indigo-800",
  hologram:  "from-cyan-400 to-pink-500",
}

export default function AppearancePage() {
  const { theme: darkMode, setTheme: setDarkMode } = useTheme()
  const { colorTheme, previewTheme, previewColorTheme, saveColorTheme, resetPreview, hasUnsavedChanges, activeTenantId } = useColorTheme()
  const { data: session } = useSession()
  const [saving, setSaving] = useState(false)

  const activeTenant = session?.user?.tenants?.find(t => t.id === activeTenantId) || session?.user?.tenants?.[0]
  const isImpersonating = typeof document !== "undefined" && document.cookie.includes("impersonate-tenant=")
  const canChangeTheme = activeTenant?.role === "owner" || activeTenant?.role === "admin" || isImpersonating
  const isSuperAdminOnly = session?.user?.isSuperAdmin && !isImpersonating

  const handleSave = async () => {
    setSaving(true)
    let tenantId = activeTenantId || session?.user?.tenants?.[0]?.id
    if (!tenantId) {
      try {
        const r = await fetch("/api/auth/session")
        tenantId = (await r.json())?.user?.tenants?.[0]?.id
      } catch {}
    }
    if (!tenantId) {
      const slug = document.cookie.match(/impersonate-tenant=([^;]+)/)?.[1]
      if (slug) {
        try { tenantId = (await (await fetch(`/api/tenant/by-slug?slug=${slug}`)).json())?.id } catch {}
      }
    }
    if (!tenantId) {
      setSaving(false)
      toast({ title: "Gagal menyimpan", description: "Tenant tidak ditemukan.", variant: "destructive" })
      return
    }
    try {
      const res = await fetch("/api/tenant/theme", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, theme: previewTheme }),
      })
      setSaving(false)
      if (res.ok) {
        toast({ title: "Tema disimpan", description: `Tema ${themes.find(t => t.id === previewTheme)?.name} diterapkan.` })
        window.location.reload()
      } else {
        const d = await res.json().catch(() => ({}))
        toast({ title: "Gagal menyimpan", description: d.error || "Terjadi kesalahan.", variant: "destructive" })
      }
    } catch {
      setSaving(false)
      toast({ title: "Gagal menyimpan", description: "Tidak dapat terhubung ke server.", variant: "destructive" })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tampilan & Tema</h1>
        <p className="text-muted-foreground mt-1">Sesuaikan tampilan aplikasi sesuai selera Anda.</p>
      </div>

      {/* Info banner */}
      <Card className="glass border-0">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            {isSuperAdminOnly
              ? "Login sebagai Super Admin. Gunakan fitur \"Login Sebagai\" untuk mengubah tema tenant."
              : canChangeTheme
              ? "Pilih tema lalu klik Simpan untuk menerapkan ke semua pengguna di organisasi ini."
              : "Hanya Owner dan Admin yang dapat mengubah tema organisasi."}
          </p>
        </CardContent>
      </Card>

      {/* Mode Tampilan + Preview — satu baris */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Mode Tampilan — compact row */}
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Sun className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Mode Tampilan</CardTitle>
                <CardDescription className="text-xs">Terang, gelap, atau ikuti sistem</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              {[
                { id: "light", label: "Terang", icon: Sun },
                { id: "dark", label: "Gelap", icon: Moon },
                { id: "system", label: "Sistem", icon: Monitor },
              ].map(mode => (
                <button key={mode.id} onClick={() => setDarkMode(mode.id)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-medium transition-all",
                    darkMode === mode.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}>
                  <mode.icon className="h-4 w-4" />
                  {mode.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Preview Tema */}
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Palette className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Preview Tema</CardTitle>
                <CardDescription className="text-xs">
                  {hasUnsavedChanges
                    ? <span className="text-amber-600 font-medium">Preview aktif — belum disimpan</span>
                    : <>Aktif: <span className="font-semibold text-primary">{themes.find(t => t.id === colorTheme)?.name || colorTheme}</span></>
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border overflow-hidden">
              <div className="h-2 btn-gradient" />
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg btn-gradient" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-2/3 rounded bg-foreground/10" />
                    <div className="h-1.5 w-1/2 rounded bg-muted-foreground/10" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="h-10 rounded-lg bg-primary/10" />
                  <div className="h-10 rounded-lg bg-accent" />
                  <div className="h-10 rounded-lg bg-muted" />
                </div>
                <div className="flex gap-1.5">
                  <div className="h-6 flex-1 rounded-lg btn-gradient" />
                  <div className="h-6 flex-1 rounded-lg border bg-background" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pilihan Tema — satu card memanjang */}
      <Card className="glass border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Palette className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Pilih Tema Warna</CardTitle>
              <CardDescription className="text-xs">Klik tema untuk preview, lalu simpan untuk menerapkan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {themes.map(t => {
            const isSelected = previewTheme === t.id
            const isSaved = colorTheme === t.id
            const gradient = themeGradients[t.id]
            return (
              <button key={t.id} onClick={() => {
                if (!canChangeTheme) {
                  toast({ title: "Tidak punya izin", description: "Hanya Owner/Admin yang dapat mengubah tema.", variant: "destructive" })
                  return
                }
                previewColorTheme(t.id)
              }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 text-left transition-all duration-150",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-transparent bg-muted/30 hover:bg-muted/60 hover:border-border"
                )}>
                {/* Swatch */}
                <div className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-base",
                  gradient
                )}>
                  {isSelected ? <Check className="h-4 w-4 text-white" /> : t.preview}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>
                      {t.name}
                    </span>
                    {isSaved && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">Aktif</span>
                    )}
                    {isSelected && !isSaved && (
                      <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">Preview</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{t.description}</p>
                </div>
                {/* Category badge */}
                <span className="text-[10px] text-muted-foreground shrink-0 hidden sm:block">
                  {t.category === "formal" ? "🏢" : t.category === "modern" ? "✨" : t.category === "creative" ? "🎨" : "⚡"}
                </span>
              </button>
            )
          })}
          {/* Tombol simpan di dalam card */}
          {canChangeTheme && hasUnsavedChanges && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
              <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={resetPreview}>
                <RotateCcw className="h-3.5 w-3.5" /> Batal
              </Button>
              <Button size="sm" className="rounded-xl gap-2 btn-gradient text-white border-0" onClick={handleSave} disabled={saving}>
                {saving ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
                Simpan Tema
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
