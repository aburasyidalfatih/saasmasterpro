"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { toast } from "@/hooks/use-toast"
import { Save, Image, Plus, Trash2, ExternalLink } from "lucide-react"

export default function WebsiteGalleryPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState<string | null>(session?.user?.tenants?.[0]?.id || null)
  const [slug, setSlug] = useState<string | null>(session?.user?.tenants?.[0]?.slug || null)
  const [gallery, setGallery] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState("")

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
        setGallery(Array.isArray(data.gallery) ? data.gallery : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [tenantId])

  const addImage = () => {
    if (!newUrl.trim()) return
    if (!newUrl.startsWith("http")) {
      toast({ title: "URL tidak valid", description: "Masukkan URL gambar yang valid (https://...)", variant: "destructive" })
      return
    }
    setGallery([...gallery, newUrl.trim()])
    setNewUrl("")
  }

  const removeImage = (i: number) => {
    setGallery(gallery.filter((_, idx) => idx !== i))
  }

  const handleSave = async () => {
    if (!tenantId) return
    setSaving(true)
    const res = await fetch("/api/tenant/website", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, gallery }),
    })
    setSaving(false)
    if (res.ok) {
      toast({ title: "Disimpan", description: `${gallery.length} foto galeri berhasil diperbarui.` })
    } else {
      toast({ title: "Gagal", description: "Terjadi kesalahan.", variant: "destructive" })
    }
  }

  if (loading) return <div className="skeleton h-64 rounded-2xl" />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kelola Galeri</h1>
          <p className="text-muted-foreground mt-1">Tambah atau hapus foto yang ditampilkan di galeri website.</p>
        </div>
        <div className="flex items-center gap-2">
          {slug && (
            <a href={`/site/${slug}/gallery`} target="_blank" rel="noopener"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <ExternalLink className="h-3.5 w-3.5" /> Lihat Galeri
            </a>
          )}
          <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
            {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
            Simpan
          </Button>
        </div>
      </div>

      {/* Add image */}
      <Card className="glass border-0">
        <CardContent className="p-5">
          <p className="text-sm font-semibold mb-3">Tambah Foto</p>
          <div className="flex gap-2">
            <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://contoh.com/foto.jpg"
              className="rounded-xl flex-1"
              onKeyDown={(e) => e.key === "Enter" && addImage()}
            />
            <Button className="gap-2 rounded-xl btn-gradient text-white border-0 shrink-0" onClick={addImage}>
              <Plus className="h-4 w-4" /> Tambah
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Masukkan URL gambar lalu tekan Enter atau klik Tambah. Rekomendasi: rasio 1:1 atau 4:3.</p>
        </CardContent>
      </Card>

      {/* Gallery grid */}
      {gallery.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="p-12 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="font-semibold mb-1">Galeri masih kosong</p>
            <p className="text-sm text-muted-foreground">Tambahkan URL foto di atas untuk mulai mengisi galeri.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((url, i) => (
              <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border">
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon"
                        className="opacity-0 group-hover:opacity-100 h-9 w-9 rounded-xl bg-destructive text-white hover:bg-destructive/90 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    }
                    title="Hapus foto ini?"
                    description="Foto akan dihapus dari galeri website."
                    confirmText="Ya, hapus"
                    onConfirm={() => removeImage(i)}
                  />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] rounded-md px-1.5 py-0.5">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">{gallery.length} foto · Klik foto untuk menghapus</p>
        </>
      )}
    </div>
  )
}
