"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"
import { Building2, User, Bell, Phone, Mail, Save, Globe, ShieldCheck, ShieldOff, ArrowRight, Upload, X, Eye, EyeOff, KeyRound, Camera, Check, Info, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { useTenantBranding } from "@/components/providers/tenant-branding-provider"

// ==================== NOTIF RECENT LIST ====================

const typeIcons: Record<string, { icon: typeof Info; color: string }> = {
  info:    { icon: Info,          color: "text-blue-500 bg-blue-500/10" },
  success: { icon: CheckCircle,   color: "text-emerald-500 bg-emerald-500/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10" },
  error:   { icon: XCircle,       color: "text-destructive bg-destructive/10" },
}

function NotifRecentList() {
  const [notifs, setNotifs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch("/api/tenant/notifications?page=1&limit=5")
      .then(r => r.json())
      .then(d => {
        const data = d.data || []
        setNotifs(data)
        setUnread(data.filter((n: any) => !n.isRead).length)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const markRead = async (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
    await fetch("/api/tenant/notifications", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
  }

  const markAllRead = async () => {
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnread(0)
    await fetch("/api/tenant/notifications", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
  }

  return (
    <>
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-px bg-border w-8" />
          <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <Bell className="h-3 w-3" />
            Notifikasi Terbaru
            {unread > 0 && (
              <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{unread}</span>
            )}
          </span>
          <div className="flex-1 h-px bg-border w-8" />
        </div>
        <div className="flex items-center gap-3 ml-3">
          {unread > 0 && (
            <button onClick={markAllRead} className="text-[11px] text-primary hover:underline flex items-center gap-1">
              <Check className="h-3 w-3" /> Tandai semua
            </button>
          )}
          <a href="/dashboard/notifications" className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1">
            Lihat semua <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">Belum ada notifikasi</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {notifs.map(n => {
            const ti = typeIcons[n.type] || typeIcons.info
            const Icon = ti.icon
            return (
              <div key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                  !n.isRead ? "bg-primary/5 hover:bg-primary/10 cursor-pointer" : "hover:bg-muted/30"
                )}>
                <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg mt-0.5", ti.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={cn("text-xs truncate", !n.isRead ? "font-semibold" : "")}>{n.title}</p>
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{n.message}</p>
                </div>
                <p className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {new Date(n.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function SettingsGeneralPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const { updateBranding } = useTenantBranding()

  const [tenantId, setTenantId] = useState<string | null>(null)

  // Role check — card Organisasi hanya untuk owner/admin
  const currentRole = session?.user?.tenants?.[0]?.role || "member"
  const isAdminOrOwner = currentRole === "owner" || currentRole === "admin" || session?.user?.isSuperAdmin

  // Profile
  const [profileForm, setProfileForm] = useState({ name: "", phone: "" })
  const [savingProfile, setSavingProfile] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Password
  const [passwordForm, setPasswordForm] = useState({ current: "", newPass: "", confirm: "" })
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false })

  // Org
  const [orgForm, setOrgForm] = useState({ name: "", description: "", logo: "" })
  const [savingOrg, setSavingOrg] = useState(false)
  const [logoPreview, setLogoPreview] = useState("")
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Domain
  const [domainStatus, setDomainStatus] = useState<{ domain: string | null; status: string | null }>({ domain: null, status: null })

  // Notif
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({ inapp: true, email: true, whatsapp: false })

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`).then(r => r.json()).then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!session?.user) return
    setProfileForm({ name: session.user.name || "", phone: (session.user as any).phone || "" })
    setAvatarPreview(session.user.image || "")
    setAvatarUrl(session.user.image || "")
  }, [session?.user])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`).then(r => r.json()).then(d => {
      setOrgForm({ name: d.name || "", description: d.description || "", logo: d.logo || "" })
      setLogoPreview(d.logo || "")
    })
    fetch(`/api/tenant/domain?tenantId=${tenantId}`).then(r => r.json()).then(d => {
      setDomainStatus({ domain: d.domain || null, status: d.customDomain?.status || null })
    }).catch(() => {})
  }, [tenantId])

  useEffect(() => {
    fetch("/api/tenant/notifications/preferences").then(r => r.json()).then(d => {
      if (d.data?.length) {
        const map: Record<string, boolean> = {}
        d.data.forEach((p: any) => { map[p.channel] = p.enabled })
        setNotifPrefs(prev => ({ ...prev, ...map }))
      }
    })
  }, [])

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return
    setSavingProfile(true)
    const res = await fetch("/api/user/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone, avatar: avatarUrl || null }),
    })
    setSavingProfile(false)
    if (res.ok) {
      await updateSession({ forceRefresh: true })
      toast({ title: "Profil disimpan" })
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title: "Gagal", description: d.error, variant: "destructive" })
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("subDir", "avatars")
      if (tenantId) fd.append("tenantId", tenantId)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) { setAvatarPreview(d.url); setAvatarUrl(d.url); toast({ title: "Foto diunggah", description: "Klik Simpan Profil untuk menyimpan." }) }
      else toast({ title: "Gagal upload", description: d.error, variant: "destructive" })
    } catch { toast({ title: "Gagal upload", variant: "destructive" }) }
    finally { setUploadingAvatar(false); e.target.value = "" }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.newPass || !passwordForm.confirm) {
      return toast({ title: "Lengkapi semua field password", variant: "destructive" })
    }
    if (passwordForm.newPass.length < 8) return toast({ title: "Password minimal 8 karakter", variant: "destructive" })
    if (passwordForm.newPass !== passwordForm.confirm) return toast({ title: "Password tidak cocok", variant: "destructive" })
    setSavingPassword(true)
    const res = await fetch("/api/user/change-password", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
    })
    const d = await res.json()
    setSavingPassword(false)
    if (res.ok) { setPasswordForm({ current: "", newPass: "", confirm: "" }); toast({ title: "Password diubah" }) }
    else toast({ title: "Gagal", description: d.error, variant: "destructive" })
  }

  const handleSaveOrg = async () => {
    if (!tenantId) return
    setSavingOrg(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, name: orgForm.name, description: orgForm.description, logo: orgForm.logo || null }),
    })
    setSavingOrg(false)
    if (res.ok) {
      updateBranding({ name: orgForm.name, logo: orgForm.logo || null })
      await updateSession({ forceRefresh: true })
      router.refresh()
      toast({ title: "Organisasi disimpan" })
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title: "Gagal", description: d.error, variant: "destructive" })
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append("file", file); fd.append("tenantId", tenantId); fd.append("subDir", "logos")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) { setOrgForm(p => ({ ...p, logo: d.url })); setLogoPreview(d.url); toast({ title: "Logo diunggah", description: "Klik Simpan Organisasi untuk menyimpan." }) }
      else toast({ title: "Gagal upload", description: d.error, variant: "destructive" })
    } finally { setUploadingLogo(false); e.target.value = "" }
  }

  const toggleNotif = async (channel: string) => {
    const newVal = !notifPrefs[channel]
    setNotifPrefs(prev => ({ ...prev, [channel]: newVal }))
    await fetch("/api/tenant/notifications/preferences", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, enabled: newVal }),
    })
    toast({ title: newVal ? "Diaktifkan" : "Dinonaktifkan", description: `Notifikasi ${channel} telah diubah.` })
  }

  const pwFields = [
    { key: "current", label: "Password Saat Ini", placeholder: "••••••••" },
    { key: "newPass", label: "Password Baru", placeholder: "Minimal 8 karakter" },
    { key: "confirm", label: "Konfirmasi", placeholder: "Ulangi password baru" },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan Umum</h1>
        <p className="text-muted-foreground mt-1">Kelola profil, organisasi, dan preferensi notifikasi.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ===== PROFIL + GANTI PASSWORD (satu card) ===== */}
        <Card className="glass border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Profil</CardTitle>
                <CardDescription>Informasi akun &amp; keamanan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Avatar row */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-border">
                  {avatarPreview
                    ? <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    : <div className="flex h-full w-full items-center justify-center bg-primary/10">
                        <span className="text-lg font-bold text-primary">{profileForm.name?.charAt(0)?.toUpperCase() || "?"}</span>
                      </div>
                  }
                </div>
                <button onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary/90">
                  {uploadingAvatar ? <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Camera className="h-2.5 w-2.5" />}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div>
                <p className="text-sm font-medium">{profileForm.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                {avatarPreview && <button onClick={() => { setAvatarPreview(""); setAvatarUrl("") }} className="text-xs text-destructive hover:underline">Hapus foto</button>}
              </div>
            </div>

            {/* Nama + Telepon 2 kolom */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Lengkap</Label>
                <Input value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama lengkap" className="rounded-xl h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">No. Telepon</Label>
                <Input value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="08xxxxxxxxxx" className="rounded-xl h-9 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input value={session?.user?.email || ""} disabled className="rounded-xl h-9 text-sm opacity-60" />
              <p className="text-[11px] text-muted-foreground -mt-1">Email tidak dapat diubah</p>
            </div>
            <Button className="btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9" onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
              Simpan Profil
            </Button>

            {/* Separator */}
            <div className="flex items-center gap-2 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <KeyRound className="h-3 w-3" /> Ganti Password
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Password fields */}
            <div className="space-y-2">
              {pwFields.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs">{label}</Label>
                  <div className="relative">
                    <Input
                      type={showPw[key] ? "text" : "password"}
                      value={passwordForm[key]}
                      onChange={e => setPasswordForm(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="rounded-xl h-9 text-sm pr-9"
                    />
                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPw[key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
              {passwordForm.newPass && (
                <div className="flex gap-1">
                  {[1,2,3,4].map(i => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors",
                      passwordForm.newPass.length >= i * 3
                        ? i <= 1 ? "bg-destructive" : i <= 2 ? "bg-amber-500" : i <= 3 ? "bg-yellow-500" : "bg-emerald-500"
                        : "bg-muted"
                    )} />
                  ))}
                </div>
              )}
            </div>
            <Button className="btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9" onClick={handleChangePassword} disabled={savingPassword}>
              {savingPassword ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <KeyRound className="h-3.5 w-3.5" />}
              Ubah Password
            </Button>
          </CardContent>
        </Card>

        {/* ===== ORGANISASI — hanya owner/admin ===== */}
        {isAdminOrOwner && (
        <Card className="glass border-0">
          <CardHeader className="pb-3">
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
          <CardContent className="space-y-3">
            {/* Logo */}
            <div className="space-y-1.5">
              <Label className="text-xs">Logo Organisasi</Label>
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0">
                  {logoPreview ? (
                    <div className="relative h-14 w-14 rounded-xl overflow-hidden border">
                      <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                      <button onClick={() => { setLogoPreview(""); setOrgForm(p => ({ ...p, logo: "" })) }}
                        className="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border-2 border-dashed bg-muted/30">
                      <Building2 className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <input ref={logoInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  <Button type="button" variant="outline" size="sm" className="rounded-xl gap-2 w-full h-9" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    {uploadingLogo ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingLogo ? "Mengunggah..." : "Upload Logo"}
                  </Button>
                  <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP, SVG. Maks 5MB.</p>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Nama Organisasi</Label>
              <Input value={orgForm.name} onChange={e => setOrgForm(p => ({ ...p, name: e.target.value }))} placeholder="Nama organisasi" className="rounded-xl h-9 text-sm" />
            </div>

            {/* Domain shortcut */}
            <div className="space-y-1.5">
              <Label className="text-xs">Domain Website</Label>
              <button onClick={() => router.push("/dashboard/settings/domain")}
                className="flex w-full items-center justify-between rounded-xl border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/60">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    {domainStatus.domain ? (
                      <>
                        <p className="text-sm font-mono font-medium">{domainStatus.domain}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {domainStatus.status === "verified"
                            ? <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            : <ShieldOff className="h-3 w-3 text-amber-500" />}
                          <span className={cn("text-xs", domainStatus.status === "verified" ? "text-emerald-600" : "text-amber-600")}>
                            {domainStatus.status === "verified" ? "Terverifikasi" : "Belum diverifikasi"}
                          </span>
                        </div>
                      </>
                    ) : <p className="text-sm text-muted-foreground">Belum ada custom domain</p>}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
              <p className="text-[11px] text-muted-foreground">Subdomain aktif: <span className="font-mono">{session?.user?.tenants?.[0]?.slug || "—"}</span></p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Deskripsi</Label>
              <textarea value={orgForm.description} onChange={e => setOrgForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi singkat organisasi" rows={3}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <Button className="btn-gradient text-white border-0 rounded-xl w-full gap-2 h-9" onClick={handleSaveOrg} disabled={savingOrg || !tenantId}>
              {savingOrg ? <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-3.5 w-3.5" />}
              Simpan Organisasi
            </Button>
          </CardContent>
        </Card>
        )}

        {/* ===== NOTIFIKASI ===== */}
        <Card className={`glass border-0 ${isAdminOrOwner ? "lg:col-span-2" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Preferensi Notifikasi</CardTitle>
                  <CardDescription>Aktifkan channel notifikasi yang ingin Anda terima</CardDescription>
                </div>
              </div>
              <a href="/dashboard/notifications/preferences"
                className="text-xs text-primary hover:underline flex items-center gap-1">
                Pengaturan lanjutan <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Toggle channels */}
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { key: "inapp", name: "In-App", desc: "Notifikasi di dalam aplikasi", icon: Bell, hint: null },
                { key: "email", name: "Email", desc: "Dikirim ke email akun Anda", icon: Mail, hint: "Butuh konfigurasi SMTP" },
                { key: "whatsapp", name: "WhatsApp", desc: "Via StarSender Gateway", icon: Phone, hint: "Butuh konfigurasi WhatsApp" },
              ].map((ch) => {
                const active = notifPrefs[ch.key] ?? false
                return (
                  <div key={ch.key}
                    className={cn(
                      "flex items-center justify-between rounded-xl border-2 px-3 py-3 transition-all duration-200",
                      active ? "border-primary/30 bg-primary/5" : "border-transparent bg-muted/40"
                    )}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                        active ? "bg-primary/10" : "bg-muted")}>
                        <ch.icon className={cn("h-4 w-4", active ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div>
                        <p className={cn("text-sm font-semibold leading-tight", active ? "text-primary" : "text-foreground")}>{ch.name}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{ch.desc}</p>
                        {!active && ch.hint && <p className="text-[10px] text-amber-500 leading-tight">{ch.hint}</p>}
                      </div>
                    </div>
                    <button onClick={() => toggleNotif(ch.key)}
                      className={cn("relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ml-2",
                        active ? "bg-primary" : "bg-muted-foreground/30")}
                      role="switch" aria-checked={active}>
                      <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                        active ? "translate-x-4" : "translate-x-0.5")} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Separator + notifikasi terbaru */}
            <NotifRecentList />
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
