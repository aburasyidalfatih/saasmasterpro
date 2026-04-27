"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import {
  Globe,
  Save,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Clock,
  AlertCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  Info,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ==================== TYPES ====================

type DomainStatus = "unverified" | "pending" | "verified" | "failed"

interface CustomDomainInfo {
  domain: string
  status: DomainStatus
  verifyToken: string
  verifiedAt?: string
  failReason?: string
}

interface DomainData {
  slug: string
  domain: string | null
  customDomain: CustomDomainInfo | null
}

// ==================== STATUS BADGE ====================

function StatusBadge({ status }: { status: DomainStatus }) {
  const map: Record<DomainStatus, { label: string; icon: React.ReactNode; className: string }> = {
    verified: {
      label: "Terverifikasi",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
      className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    },
    unverified: {
      label: "Belum Diverifikasi",
      icon: <ShieldOff className="h-3.5 w-3.5" />,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
    pending: {
      label: "Menunggu",
      icon: <Clock className="h-3.5 w-3.5" />,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    failed: {
      label: "Gagal",
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
  }
  const { label, icon, className } = map[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        className
      )}
    >
      {icon}
      {label}
    </span>
  )
}

// ==================== MAIN PAGE ====================

export default function DomainSettingsPage() {
  const { data: session } = useSession()

  const [tenantId, setTenantId] = useState<string | null>(null)
  const [data, setData] = useState<DomainData | null>(null)
  const [loading, setLoading] = useState(true)

  const [domainInput, setDomainInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)

  // ==================== RESOLVE TENANT ID ====================

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (id) { setTenantId(id); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const slug = match?.[1]
    if (slug) {
      fetch(`/api/tenant/by-slug?slug=${slug}`)
        .then((r) => r.json())
        .then((d) => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  // ==================== LOAD DATA ====================

  const loadData = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/domain?tenantId=${tenantId}`)
      const json = await res.json()
      setData(json)
      if (json.domain) setDomainInput(json.domain)
    } catch {
      toast({ title: "Gagal memuat data", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { loadData() }, [loadData])

  // ==================== HANDLERS ====================

  const handleSave = async () => {
    if (!tenantId || !domainInput.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/tenant/domain", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, domain: domainInput.trim() }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({ title: "Domain disimpan", description: json.message })
        await loadData()
      } else {
        toast({ title: "Gagal", description: json.error, variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleVerify = async () => {
    if (!tenantId) return
    setVerifying(true)
    try {
      const res = await fetch("/api/tenant/domain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast({ title: "✅ Domain terverifikasi!", description: json.message })
      } else {
        toast({
          title: json.success === false ? "Verifikasi gagal" : "Gagal",
          description: json.message || json.error,
          variant: "destructive",
        })
      }
      await loadData()
    } finally {
      setVerifying(false)
    }
  }

  const handleRemove = async () => {
    if (!tenantId) return
    setRemoving(true)
    try {
      const res = await fetch("/api/tenant/domain", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId }),
      })
      const json = await res.json()
      if (res.ok) {
        toast({ title: "Domain dihapus", description: json.message })
        setDomainInput("")
        await loadData()
      } else {
        toast({ title: "Gagal", description: json.error, variant: "destructive" })
      }
    } finally {
      setRemoving(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Disalin", description: `${label} disalin ke clipboard.` })
  }

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="space-y-2">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-4 w-72" />
        </div>
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-48 rounded-2xl" />
      </div>
    )
  }

  const customDomain = data?.customDomain
  const isVerified = customDomain?.status === "verified"
  const hasCustomDomain = !!data?.domain
  const subdomain = data?.slug
    ? `${data.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"}`
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Custom Domain</h1>
        <p className="text-muted-foreground mt-1">
          Hubungkan domain Anda sendiri ke website tenant ini.
        </p>
      </div>

      {/* URL Saat Ini */}
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">URL Website Aktif</CardTitle>
              <CardDescription>Domain yang saat ini melayani website Anda</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Subdomain default */}
          <div className="flex items-center justify-between rounded-xl border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Subdomain Default</p>
                <p className="text-sm font-mono font-medium">{subdomain || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">
                Aktif
              </span>
              {subdomain && (
                <a
                  href={`http://${subdomain}`}
                  target="_blank"
                  rel="noopener"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>

          {/* Custom domain (jika ada) */}
          {hasCustomDomain && customDomain && (
            <div
              className={cn(
                "flex items-center justify-between rounded-xl border px-4 py-3",
                isVerified ? "border-emerald-500/30 bg-emerald-500/5" : "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    isVerified ? "bg-emerald-500/10" : "bg-amber-500/10"
                  )}
                >
                  {isVerified ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <ShieldOff className="h-4 w-4 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Custom Domain</p>
                  <p className="text-sm font-mono font-medium">{customDomain.domain}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={customDomain.status} />
                {isVerified && (
                  <a
                    href={`https://${customDomain.domain}`}
                    target="_blank"
                    rel="noopener"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Set Domain */}
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Konfigurasi Domain</CardTitle>
              <CardDescription>Masukkan domain yang ingin Anda hubungkan</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Custom Domain</Label>
            <div className="flex gap-2">
              <Input
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value.toLowerCase().trim())}
                placeholder="contoh: mybusiness.com"
                className="rounded-xl font-mono"
              />
              <Button
                className="btn-gradient text-white border-0 rounded-xl gap-2 shrink-0"
                onClick={handleSave}
                disabled={saving || !domainInput.trim()}
              >
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Masukkan domain tanpa <code className="bg-muted px-1 rounded">https://</code> atau{" "}
              <code className="bg-muted px-1 rounded">www.</code>
            </p>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-4">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Setelah menyimpan domain, Anda perlu menambahkan DNS record dan melakukan verifikasi.
              Subdomain default tetap aktif selama custom domain belum terverifikasi.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Panduan DNS + Verifikasi */}
      {hasCustomDomain && customDomain && (
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Verifikasi & Konfigurasi DNS</CardTitle>
                  <CardDescription>
                    Tambahkan record berikut di panel DNS domain Anda
                  </CardDescription>
                </div>
              </div>
              <StatusBadge status={customDomain.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Step 1: CNAME */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  1
                </span>
                <p className="text-sm font-semibold">Tambahkan CNAME Record</p>
              </div>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Value</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">CNAME</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">@</code>
                          <button
                            onClick={() => copyToClipboard("@", "Name")}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">
                            {process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saasmasterpro.com"}
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                process.env.NEXT_PUBLIC_ROOT_DOMAIN || "saasmasterpro.com",
                                "CNAME value"
                              )
                            }
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">3600</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">
                Jika domain root tidak mendukung CNAME, gunakan{" "}
                <strong>ALIAS</strong> atau <strong>ANAME</strong> record (tergantung provider DNS Anda).
              </p>
            </div>

            {/* Step 2: TXT Verification */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                  2
                </span>
                <p className="text-sm font-semibold">Tambahkan TXT Record untuk Verifikasi</p>
              </div>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Type</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Name</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-3">
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">TXT</code>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">_smp-verify</code>
                          <button
                            onClick={() =>
                              copyToClipboard("_smp-verify", "TXT Name")
                            }
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono break-all">{customDomain.verifyToken}</code>
                          <button
                            onClick={() => copyToClipboard(customDomain.verifyToken, "TXT Value")}
                            className="text-muted-foreground hover:text-primary shrink-0"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pesan error jika gagal */}
            {customDomain.status === "failed" && customDomain.failReason && (
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Verifikasi Gagal</p>
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {customDomain.failReason}
                  </p>
                </div>
              </div>
            )}

            {/* Verified info */}
            {isVerified && customDomain.verifiedAt && (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    Domain terverifikasi
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diverifikasi pada{" "}
                    {new Date(customDomain.verifiedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Verify button */}
            {!isVerified && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                    3
                  </span>
                  <p className="text-sm font-semibold">Verifikasi Domain</p>
                </div>
                <p className="text-xs text-muted-foreground pl-8">
                  Setelah menambahkan DNS record, klik tombol di bawah. Propagasi DNS bisa memakan
                  waktu hingga 24 jam.
                </p>
                <Button
                  className="btn-gradient text-white border-0 rounded-xl gap-2 w-full"
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {verifying ? "Memeriksa DNS..." : "Verifikasi Sekarang"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hapus Domain */}
      {hasCustomDomain && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2 className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-lg text-destructive">Hapus Custom Domain</CardTitle>
                <CardDescription>
                  Website akan kembali menggunakan subdomain default
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between rounded-xl border border-destructive/20 p-4">
              <div>
                <p className="font-medium text-sm">{data?.domain}</p>
                <p className="text-xs text-muted-foreground">
                  Custom domain akan dihapus dan tidak bisa diakses lagi
                </p>
              </div>
              <ConfirmDialog
                trigger={
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-lg text-xs"
                    disabled={removing}
                  >
                    {removing ? "Menghapus..." : "Hapus Domain"}
                  </Button>
                }
                title="Hapus custom domain?"
                description={`Domain ${data?.domain} akan dihapus. Website akan kembali menggunakan subdomain default. Tindakan ini tidak dapat dibatalkan.`}
                confirmText="Ya, hapus domain"
                onConfirm={handleRemove}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
