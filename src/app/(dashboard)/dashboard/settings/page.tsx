"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Building2, User, Bell, Phone, Mail, Save } from "lucide-react"

export default function SettingsGeneralPage() {
  const { data: session, update: updateSession } = useSession()

  // Resolve tenantId (support impersonate)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)

  // Org form
  const [orgForm, setOrgForm] = useState({ name: "", description: "" })
  const [savingOrg, setSavingOrg] = useState(false)

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    inapp: true, email: true, whatsapp: false,
  })

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`)
        .then((r) => r.json())
        .then((data) => { if (data.id) setTenantId(data.id) })
    }
  }, [session?.user?.tenants])

  // Load profile data
  useEffect(() => {
    if (!session?.user) return
    setProfileForm({
      name: session.user.name || "",
      phone: (session.user as any).phone || "",
    })
  }, [session?.user])

  // Load org data
  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((data) => {
        setOrgForm({
          name: data.name || "",
          description: data.description || "",
        })
      })
  }, [tenantId])

  // Load notification prefs
  useEffect(() => {
    fetch("/api/tenant/notifications/preferences")
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.length) {
          const map: Record<string, boolean> = {}
          data.data.forEach((p: any) => { map[p.channel] = p.enabled })
          setNotifPrefs((prev) => ({ ...prev, ...map }))
        }
      })
  }, [])

  // Save profile
  const handleSaveProfile = async () => {
    if (!session?.user?.id) return
    setSavingProfile(true)
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone }),
    })
    setSavingProfile(false)
    if (res.ok) {
      await updateSession()
      toast({ title: "Profil disimpan", description: "Informasi profil Anda berhasil diperbarui." })
    } else {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Gagal", description: data.error || "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  // Save org
  const handleSaveOrg = async () => {
    if (!tenantId) return
    setSavingOrg(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, name: orgForm.name, description: orgForm.description }),
    })
    setSavingOrg(false)
    if (res.ok) {
      await updateSession()
      toast({ title: "Organisasi disimpan", description: "Nama dan deskripsi organisasi berhasil diperbarui." })
    } else {
      const data = await res.json().catch(() => ({}))
      toast({ title: "Gagal", description: data.error || "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  // Toggle notification pref
  const toggleNotif = async (channel: string) => {
    const newVal = !notifPrefs[channel]
    setNotifPrefs((prev) => ({ ...prev, [channel]: newVal }))
    await fetch("/api/tenant/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, enabled: newVal }),
    })
    toast({ title: newVal ? "Diaktifkan" : "Dinonaktifkan", description: `Notifikasi ${channel} telah diubah.` })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Umum</h1>
        <p className="text-muted-foreground mt-1">Kelola profil, organisasi, dan preferensi notifikasi.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profil */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profil</CardTitle>
                <CardDescription>Informasi akun Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Nama lengkap Anda"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={session?.user?.email || ""} disabled className="rounded-xl opacity-60" />
              <p className="text-xs text-muted-foreground">Email tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label>No. Telepon</Label>
              <Input
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                placeholder="08xxxxxxxxxx"
                className="rounded-xl"
              />
            </div>
            <Button
              className="btn-gradient text-white border-0 rounded-xl w-full gap-2"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Profil
            </Button>
          </CardContent>
        </Card>

        {/* Organisasi */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Organisasi</CardTitle>
                <CardDescription>Pengaturan tenant Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Organisasi</Label>
              <Input
                value={orgForm.name}
                onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                placeholder="Nama organisasi"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label>Subdomain</Label>
              <Input
                value={session?.user?.tenants?.[0]?.slug || ""}
                disabled
                className="rounded-xl opacity-60"
              />
              <p className="text-xs text-muted-foreground">Subdomain tidak dapat diubah</p>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <textarea
                value={orgForm.description}
                onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })}
                placeholder="Deskripsi singkat organisasi"
                rows={3}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none"
              />
            </div>
            <Button
              className="btn-gradient text-white border-0 rounded-xl w-full gap-2"
              onClick={handleSaveOrg}
              disabled={savingOrg || !tenantId}
            >
              {savingOrg ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
              Simpan Organisasi
            </Button>
          </CardContent>
        </Card>

        {/* Notifikasi */}
        <Card className="glass border-0 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Preferensi Notifikasi</CardTitle>
                <CardDescription>Pilih channel notifikasi yang Anda inginkan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { key: "inapp", name: "In-App", desc: "Notifikasi di dalam aplikasi", icon: Bell },
                { key: "email", name: "Email", desc: "Via SMTP yang dikonfigurasi", icon: Mail },
                { key: "whatsapp", name: "WhatsApp", desc: "Via StarSender Gateway", icon: Phone },
              ].map((ch) => {
                const active = notifPrefs[ch.key] ?? false
                return (
                  <button
                    key={ch.key}
                    onClick={() => toggleNotif(ch.key)}
                    className={cn(
                      "flex flex-col items-center gap-2.5 rounded-xl border-2 p-5 transition-all duration-200 text-center",
                      active ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", active ? "bg-primary/10" : "bg-muted")}>
                      <ch.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("text-sm font-semibold", active ? "text-primary" : "text-foreground")}>{ch.name}</span>
                    <span className="text-[11px] text-muted-foreground">{ch.desc}</span>
                    <span className={cn("text-[10px] font-medium rounded-full px-2.5 py-0.5", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      {active ? "Aktif" : "Nonaktif"}
                    </span>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
