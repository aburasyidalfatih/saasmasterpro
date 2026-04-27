"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Server, Shield, Eye, EyeOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface Settings {
  allow_impersonate_user: string
}

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({ allow_impersonate_user: "true" })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((r) => r.json())
      .then((data) => { setSettings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggleSetting = async (key: string) => {
    const current = settings[key as keyof Settings]
    const newValue = current === "true" ? "false" : "true"

    setSettings((prev) => ({ ...prev, [key]: newValue }))

    const res = await fetch("/api/super-admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: newValue }),
    })

    if (res.ok) {
      toast({
        title: "Setting disimpan",
        description: `${key === "allow_impersonate_user" ? "Login sebagai user" : key} telah ${newValue === "true" ? "diaktifkan" : "dinonaktifkan"}.`,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Sistem</h1>
        <p className="text-muted-foreground mt-1">Konfigurasi umum platform SaasMasterPro</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fitur Platform */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Fitur Platform</CardTitle>
                <CardDescription>Aktifkan atau nonaktifkan fitur untuk semua tenant</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Login Sebagai User */}
            <button
              onClick={() => toggleSetting("allow_impersonate_user")}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border-2 p-4 transition-all duration-200 text-left",
                settings.allow_impersonate_user === "true"
                  ? "border-primary bg-primary/5"
                  : "border-transparent bg-muted/50 hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl",
                  settings.allow_impersonate_user === "true" ? "bg-primary/10" : "bg-muted"
                )}>
                  {settings.allow_impersonate_user === "true"
                    ? <Eye className="h-5 w-5 text-primary" />
                    : <EyeOff className="h-5 w-5 text-muted-foreground" />
                  }
                </div>
                <div>
                  <p className="font-medium text-sm">Login Sebagai User</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Izinkan tenant admin melihat dashboard sebagai user mereka
                  </p>
                </div>
              </div>
              <span className={cn(
                "text-[11px] font-semibold rounded-full px-2.5 py-1",
                settings.allow_impersonate_user === "true"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-muted text-muted-foreground"
              )}>
                {settings.allow_impersonate_user === "true" ? "Aktif" : "Nonaktif"}
              </span>
            </button>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Server className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Informasi Sistem</CardTitle>
                <CardDescription>Detail platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Versi", value: "1.0.0" },
              { label: "Framework", value: "Next.js 16.2" },
              { label: "Auth", value: "Auth.js v5" },
              { label: "Database", value: "SQLite (dev) / PostgreSQL (prod)" },
              { label: "Payment", value: "Tripay" },
              { label: "WhatsApp", value: "StarSender" },
              { label: "Email", value: "Nodemailer SMTP" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-2.5">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-medium">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
