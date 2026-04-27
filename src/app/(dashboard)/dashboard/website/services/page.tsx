"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Save, Briefcase, Plus, Trash2, GripVertical, ExternalLink } from "lucide-react"

interface Service {
  title: string
  description: string
  icon: string
}

const EMOJI_OPTIONS = ["🌐","📱","💡","☁️","🔒","📊","🎯","⚡","🚀","🛠️","📚","🤝","🏆","💎","🔬","🎨","📋","🌟","💼","🔧"]

export default function WebsiteServicesPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(session?.user?.tenants?.[0]?.id || null)
  const [slug, setSlug] = useState<string | null>(session?.user?.tenants?.[0]?.slug || null)
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    const sessionTenantId = session?.user?.tenants?.[0]?.id
    const sessionSlug = session?.user?.tenants?.[0]?.slug
    if (sessionTenantId) {
      setTenantId(sessionTenantId)
      setSlug(sessionSlug || null)
      return
    }
    // Impersonate mode: resolve from cookie
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const impersonateSlug = match?.[1]
    if (impersonateSlug) {
      setSlug(impersonateSlug)
      fetch(`/api/tenant/by-slug?slug=${impersonateSlug}`)
        .then((r) => r.json())
        .then((data) => { if (data.id) setTenantId(data.id) })
        .catch(() => {})
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then((r) => r.json())
      .then((data) => {
        setServices(Array.isArray(data.services) ? data.services : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const addService = () => {
    setServices([...services, { title: "", description: "", icon: "⚡" }])
  }

  const updateService = (i: number, field: keyof Service, value: string) => {
    setServices(services.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  const removeService = (i: number) => {
    setServices(services.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!tenantId) return
    const invalid = services.some((s) => !s.title.trim())
    if (invalid) {
      toast({ title: "Validasi gagal", description: "Semua layanan harus memiliki judul.", variant: "destructive" })
      return
    }
    setSaving(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, services }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Disimpan", description: `${services.length} layanan berhasil diperbarui.` })
    } else {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Layanan</h1>
          <p className="text-muted-foreground mt-1">Tambah, edit, atau hapus layanan yang ditampilkan di website.</p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={`/site/${slug}/services`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Halaman
            </a>
          )}
          <Button variant="outline" className="gap-2 rounded-xl" onClick={addService}>
            <Plus className="h-4 w-4" /> Tambah Layanan
          </Button>
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </div>

      {services.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-semibold mb-1">Belum ada layanan</p>
            <p className="text-sm text-muted-foreground mb-4">Tambahkan layanan yang ingin ditampilkan di website Anda.</p>
            <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={addService}>
              <Plus className="h-4 w-4" /> Tambah Layanan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {services.map((svc, i) => (
            <Card key={i} className="glass border-0">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex items-center gap-2 shrink-0 mt-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                    {/* Icon picker */}
                    <div className="relative group">
                      <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl hover:bg-primary/20 transition-colors">
                        {svc.icon || "⚡"}
                      </button>
                      <div className="absolute top-full left-0 mt-1 z-10 hidden group-focus-within:grid grid-cols-5 gap-1 p-2 bg-background border rounded-xl shadow-lg w-44">
                        {EMOJI_OPTIONS.map((emoji) => (
                          <button key={emoji} onClick={() => updateService(i, "icon", emoji)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted text-lg">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Judul Layanan *</Label>
                      <Input value={svc.title} onChange={(e) => updateService(i, "title", e.target.value)}
                        placeholder="Nama layanan" className="rounded-xl h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Ikon (emoji)</Label>
                      <Input value={svc.icon} onChange={(e) => updateService(i, "icon", e.target.value)}
                        placeholder="⚡" className="rounded-xl h-9" maxLength={4} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label className="text-xs">Deskripsi</Label>
                      <textarea value={svc.description} onChange={(e) => updateService(i, "description", e.target.value)}
                        placeholder="Deskripsi singkat layanan ini..." rows={2}
                        className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
                    </div>
                  </div>
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive shrink-0 mt-1">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                    title="Hapus layanan ini?"
                    description={`"${svc.title || "Layanan ini"}" akan dihapus dari website.`}
                    confirmText="Ya, hapus"
                    onConfirm={() => removeService(i)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {services.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" className="gap-2 rounded-xl" onClick={addService}>
            <Plus className="h-4 w-4" /> Tambah Layanan
          </Button>
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan Semua
          </Button>
        </div>
      )}
    </div>
  )
}
