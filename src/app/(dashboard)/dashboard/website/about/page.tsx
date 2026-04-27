"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Save, Info, ExternalLink, Globe, Upload, X } from "lucide-react"

export default function WebsiteAboutPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [uploadingHero, setUploadingHero] = useState(false)
  const heroInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: "",
    tagline: "",
    description: "",
    about: "",
    heroImage: "",
  })

  // Resolve tenantId
  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    const s = session?.user?.tenants?.[0]?.slug
    if (id) { setTenantId(id); setSlug(s || null); return }
    const match = document.cookie.match(/impersonate-tenant=([^;]+)/)
    const impSlug = match?.[1]
    if (impSlug) {
      setSlug(impSlug)
      fetch(`/api/tenant/by-slug?slug=${impSlug}`)
        .then(r => r.json())
        .then(d => { if (d.id) setTenantId(d.id) })
    }
  }, [session?.user?.tenants])

  useEffect(() => {
    if (!tenantId) return
    fetch(`/api/tenant/website?tenantId=${tenantId}`)
      .then(r => r.json())
      .then(d => {
        setForm({
          name: d.name || "",
          tagline: d.tagline || "",
          description: d.description || "",
          about: d.about || "",
          heroImage: d.heroImage || "",
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, ...form }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Disimpan", description: "Profil & tentang kami berhasil diperbarui." })
    } else {
      const d = await res.json().catch(() => ({}))
      toast({ title: "Gagal", description: d.error || "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !tenantId) return
    setUploadingHero(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("tenantId", tenantId)
      fd.append("subDir", "hero")
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (res.ok && d.url) {
        setForm(p => ({ ...p, heroImage: d.url }))
        toast({ title: "Gambar diunggah", description: "Klik Simpan untuk menyimpan perubahan." })
      } else {
        toast({ title: "Gagal upload", description: d.error, variant: "destructive" })
      }
    } finally {
      setUploadingHero(false)
      e.target.value = ""
    }
  }

  if (loading) return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {[1,2,3].map(i => <div key={i} className="skeleton h-40 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profil & Tentang Kami</h1>
          <p className="text-muted-foreground mt-1">Kelola identitas, konten beranda, dan cerita organisasi Anda.</p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={`/site/${slug}/about`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Halaman
            </a>
          )}
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        {/* Identitas Website */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Identitas Website</CardTitle>
                <CardDescription>Nama, tagline, dan deskripsi singkat</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Organisasi</Label>
              <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nama organisasi Anda" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Tagline / Slogan</Label>
              <Input value={form.tagline} onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                placeholder="Slogan singkat yang menggambarkan organisasi" className="rounded-xl" />
              <p className="text-xs text-muted-foreground">Tampil di hero section dan navbar website</p>
            </div>
            <div className="space-y-2">
              <Label>Deskripsi Singkat</Label>
              <textarea value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi singkat organisasi Anda (maks. 300 karakter)"
                maxLength={300} rows={4}
                className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
              <p className="text-xs text-muted-foreground">{form.description.length}/300 karakter</p>
            </div>
          </CardContent>
        </Card>

        {/* Gambar Hero */}
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Gambar Hero</CardTitle>
                <CardDescription>Foto utama di bagian atas website</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload atau URL */}
            <div className="space-y-2">
              <Label>Gambar Hero</Label>
              <div className="flex gap-2">
                <Input value={form.heroImage} onChange={e => setForm(p => ({ ...p, heroImage: e.target.value }))}
                  placeholder="https://... atau upload file" className="rounded-xl flex-1" />
                <input ref={heroInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleHeroUpload} />
                <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0"
                  onClick={() => heroInputRef.current?.click()} disabled={uploadingHero}>
                  {uploadingHero
                    ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    : <Upload className="h-4 w-4" />}
                </Button>
                {form.heroImage && (
                  <Button type="button" variant="outline" size="icon" className="rounded-xl shrink-0 text-destructive"
                    onClick={() => setForm(p => ({ ...p, heroImage: "" }))}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Rekomendasi: 1920×1080px, maks 5MB</p>
            </div>
            {form.heroImage ? (
              <div className="rounded-xl overflow-hidden border aspect-video">
                <img src={form.heroImage} alt="Hero preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed aspect-video flex items-center justify-center bg-muted/30">
                <div className="text-center">
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm text-muted-foreground">Belum ada gambar hero</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tentang Kami */}
        <Card className="glass border-0 lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Tentang Kami</CardTitle>
                <CardDescription>Cerita lengkap, sejarah, visi, dan misi organisasi</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <textarea value={form.about}
              onChange={e => setForm(p => ({ ...p, about: e.target.value }))}
              placeholder="Ceritakan tentang organisasi Anda, sejarah, visi, dan misi..."
              rows={8}
              className="flex w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none" />
            <p className="text-xs text-muted-foreground mt-2">Tampil di halaman Tentang Kami website</p>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
