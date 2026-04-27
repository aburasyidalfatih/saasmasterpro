"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import {
  Lock, Smartphone, ShieldCheck, ShieldOff, Copy,
  Monitor, Trash2, Eye, EyeOff, Info, ExternalLink,
} from "lucide-react"

interface SessionRow {
  id: string
  deviceName: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
  expires: string
}

export default function SecurityPage() {
  const { data: session, update: updateSession } = useSession()
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  // Role check — Google OAuth hanya untuk owner/admin
  const currentRole = session?.user?.tenants?.[0]?.role || "member"
  const isAdminOrOwner = currentRole === "owner" || currentRole === "admin" || session?.user?.isSuperAdmin

  // Google OAuth state
  const [googleEnabled, setGoogleEnabled] = useState(false)
  const [googleClientId, setGoogleClientId] = useState("")
  const [googleClientSecret, setGoogleClientSecret] = useState("")
  const [showGoogleSecret, setShowGoogleSecret] = useState(false)
  const [savingGoogle, setSavingGoogle] = useState(false)

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState("")
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [disablePassword, setDisablePassword] = useState("")
  const [disableLoading, setDisableLoading] = useState(false)

  useEffect(() => {
    setTwoFAEnabled(!!(session?.user as any)?.twoFactorEnabled)
  }, [session])

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`)
        .then(r => r.json())
        .then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  // Load Google OAuth config — hanya jika admin/owner
  useEffect(() => {
    if (!tenantId || !isAdminOrOwner) return
    fetch(`/api/tenant/settings?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        if (d.google) {
          setGoogleEnabled(true)
          setGoogleClientId(d.google.clientId || "")
          setGoogleClientSecret(d.google.clientSecret || "")
        }
      })
  }, [tenantId, isAdminOrOwner])

  // Fetch sessions
  useEffect(() => {
    fetch("/api/auth/sessions")
      .then(r => r.json())
      .then(d => { setSessions(d.data || []); setSessionsLoading(false) })
      .catch(() => setSessionsLoading(false))
  }, [])

  // 2FA handlers
  const handleSetup2FA = async () => {
    setSetupLoading(true)
    try {
      const res = await fetch("/api/auth/two-factor/setup", { method: "POST" })
      const d = await res.json()
      if (res.ok) { setQrCode(d.qrCode); setSecret(d.secret) }
      else toast({ title: "Gagal", description: d.error, variant: "destructive" })
    } catch { toast({ title: "Gagal", description: "Tidak dapat terhubung ke server", variant: "destructive" }) }
    setSetupLoading(false)
  }

  const handleVerify2FA = async () => {
    setVerifyLoading(true)
    try {
      const res = await fetch("/api/auth/two-factor/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      })
      const d = await res.json()
      if (res.ok) {
        setTwoFAEnabled(true); setBackupCodes(d.backupCodes)
        setQrCode(null); setSecret(null); setVerifyCode("")
        await updateSession()
        toast({ title: "2FA Aktif", description: "Autentikasi dua faktor berhasil diaktifkan." })
      } else toast({ title: "Gagal", description: d.error, variant: "destructive" })
    } catch { toast({ title: "Gagal", description: "Tidak dapat terhubung ke server", variant: "destructive" }) }
    setVerifyLoading(false)
  }

  const handleDisable2FA = async () => {
    setDisableLoading(true)
    try {
      const res = await fetch("/api/auth/two-factor/disable", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      })
      const d = await res.json()
      if (res.ok) {
        setTwoFAEnabled(false); setDisablePassword("")
        await updateSession()
        toast({ title: "2FA Nonaktif", description: "Autentikasi dua faktor berhasil dinonaktifkan." })
      } else toast({ title: "Gagal", description: d.error, variant: "destructive" })
    } catch { toast({ title: "Gagal", description: "Tidak dapat terhubung ke server", variant: "destructive" }) }
    setDisableLoading(false)
  }

  const handleRevokeSession = async (sessionId: string) => {
    const res = await fetch("/api/auth/sessions", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
    if (res.ok) {
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast({ title: "Session dihapus", description: "Perangkat berhasil dikeluarkan." })
    }
  }

  const handleSaveGoogle = async () => {
    if (!tenantId) return
    setSavingGoogle(true)
    const res = await fetch("/api/tenant/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        settings: googleEnabled
          ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
          : { google: null },
      }),
    })
    setSavingGoogle(false)
    if (res.ok) toast({ title: "Disimpan", description: "Konfigurasi Google OAuth berhasil disimpan." })
    else toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
  }

  const parseUA = (ua: string | null) => {
    if (!ua) return "Perangkat tidak dikenal"
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[0] || "Browser"
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0] || "OS"
    return `${os} · ${browser}`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Keamanan</h1>
        <p className="text-muted-foreground mt-1">Kelola keamanan akun Anda.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* ===== 2FA ===== */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                {twoFAEnabled
                  ? <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  : <ShieldOff className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <CardTitle className="text-lg">Autentikasi Dua Faktor</CardTitle>
                <CardDescription>
                  {twoFAEnabled ? "2FA aktif — akun Anda lebih aman" : "Tambahkan lapisan keamanan ekstra"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {backupCodes && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Simpan backup codes ini di tempat aman!</p>
                <div className="grid grid-cols-2 gap-2">
                  {backupCodes.map(code => (
                    <code key={code} className="text-xs bg-background rounded-lg px-2 py-1.5 text-center font-mono">{code}</code>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="rounded-lg w-full gap-2" onClick={() => {
                  navigator.clipboard.writeText(backupCodes.join("\n"))
                  toast({ title: "Disalin", description: "Backup codes disalin ke clipboard." })
                }}>
                  <Copy className="h-3 w-3" /> Salin Semua
                </Button>
                <Button variant="ghost" size="sm" className="rounded-lg w-full text-xs" onClick={() => setBackupCodes(null)}>
                  Saya sudah menyimpannya
                </Button>
              </div>
            )}

            {qrCode && !twoFAEnabled && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrCode} alt="QR Code 2FA" className="rounded-xl border" width={200} height={200} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Atau masukkan kode manual:</p>
                  <code className="text-xs bg-muted rounded-lg px-3 py-1.5 font-mono select-all">{secret}</code>
                </div>
                <div className="space-y-2">
                  <Label>Kode Verifikasi</Label>
                  <Input placeholder="000000" maxLength={6} value={verifyCode}
                    onChange={e => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    className="rounded-xl text-center tracking-widest text-lg" />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 btn-gradient text-white border-0 rounded-xl" onClick={handleVerify2FA}
                    disabled={verifyLoading || verifyCode.length !== 6}>
                    {verifyLoading ? "Memverifikasi..." : "Aktifkan 2FA"}
                  </Button>
                  <Button variant="outline" className="rounded-xl" onClick={() => { setQrCode(null); setSecret(null) }}>
                    Batal
                  </Button>
                </div>
              </div>
            )}

            {!qrCode && !backupCodes && (
              twoFAEnabled ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-400">2FA aktif menggunakan aplikasi authenticator</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Password untuk menonaktifkan</Label>
                    <Input type="password" placeholder="Masukkan password Anda" value={disablePassword}
                      onChange={e => setDisablePassword(e.target.value)} className="rounded-xl" />
                  </div>
                  <Button variant="destructive" className="rounded-xl w-full" onClick={handleDisable2FA}
                    disabled={disableLoading || !disablePassword}>
                    {disableLoading ? "Menonaktifkan..." : "Nonaktifkan 2FA"}
                  </Button>
                </div>
              ) : (
                <Button className="btn-gradient text-white border-0 rounded-xl w-full gap-2" onClick={handleSetup2FA} disabled={setupLoading}>
                  {setupLoading ? "Memuat..." : <><ShieldCheck className="h-4 w-4" /> Aktifkan 2FA</>}
                </Button>
              )
            )}
          </CardContent>
        </Card>

        {/* ===== SESI AKTIF ===== */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Sesi Aktif</CardTitle>
                <CardDescription>Perangkat yang sedang login ke akun Anda</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="skeleton h-16 w-full rounded-xl" />)}
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6">
                <Monitor className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Tidak ada sesi aktif tercatat</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s, i) => (
                  <div key={s.id} className="flex items-center justify-between rounded-xl border p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Monitor className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.deviceName || parseUA(s.userAgent)}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.ipAddress || "IP tidak diketahui"} · {new Date(s.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {i === 0 && <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">Saat ini</span>}
                      {i !== 0 && (
                        <ConfirmDialog
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          title="Hapus sesi ini?"
                          description="Perangkat ini akan dikeluarkan dari akun Anda."
                          confirmText="Ya, keluarkan"
                          onConfirm={() => handleRevokeSession(s.id)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== GOOGLE OAUTH — hanya owner/admin ===== */}
        {isAdminOrOwner && (
          <Card className="glass border-0 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Login dengan Google</CardTitle>
                    <CardDescription>Konfigurasi Google OAuth untuk tenant Anda</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-amber-500/10 text-amber-600 rounded-full px-2.5 py-1 font-medium">
                    Admin Only
                  </span>
                  <button
                    onClick={() => setGoogleEnabled(!googleEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${googleEnabled ? "bg-primary" : "bg-muted"}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${googleEnabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Jika tidak dikonfigurasi, sistem menggunakan Google OAuth default platform.</p>
                  <p>Aktifkan dan isi Client ID/Secret dari Google Cloud Console untuk menggunakan OAuth sendiri.</p>
                </div>
              </div>

              {googleEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Google Client ID</Label>
                    <Input value={googleClientId} onChange={e => setGoogleClientId(e.target.value)}
                      placeholder="xxxx.apps.googleusercontent.com" className="rounded-xl font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label>Google Client Secret</Label>
                    <div className="relative">
                      <Input type={showGoogleSecret ? "text" : "password"} value={googleClientSecret}
                        onChange={e => setGoogleClientSecret(e.target.value)}
                        placeholder="GOCSPX-..." className="rounded-xl pr-10 font-mono text-xs" />
                      <button type="button" onClick={() => setShowGoogleSecret(!showGoogleSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showGoogleSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="sm:col-span-2 rounded-xl border bg-muted/30 p-4 space-y-2">
                    <p className="text-xs font-semibold">Authorized Redirect URI:</p>
                    <code className="text-xs bg-background rounded-lg px-3 py-2 block font-mono select-all">
                      {typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback/google` : "https://yourdomain.com/api/auth/callback/google"}
                    </code>
                    <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="h-3 w-3" /> Buka Google Cloud Console
                    </a>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSaveGoogle} disabled={savingGoogle}>
                  {savingGoogle && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
                  Simpan Pengaturan Google
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ===== ZONA BAHAYA ===== */}
        <Card className="border-destructive/30 bg-destructive/5 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                <Lock className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg text-destructive">Zona Bahaya</CardTitle>
                <CardDescription>Tindakan ini tidak dapat dibatalkan</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border border-destructive/20 p-4">
              <div>
                <p className="font-medium text-sm">Hapus Akun</p>
                <p className="text-xs text-muted-foreground">Semua data Anda akan dihapus secara permanen</p>
              </div>
              <ConfirmDialog
                trigger={<Button variant="destructive" size="sm" className="rounded-lg text-xs">Hapus Akun</Button>}
                title="Hapus akun Anda?"
                description="Semua data termasuk organisasi dan file Anda akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
                confirmText="Ya, hapus akun saya"
                onConfirm={() => { toast({ title: "Fitur segera hadir", description: "Penghapusan akun akan tersedia di versi berikutnya." }) }}
              />
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
