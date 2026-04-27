"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { MessageCircle, Save, Send, Eye, EyeOff, CheckCircle } from "lucide-react"

export default function SuperAdminWhatsAppPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [testPhone, setTestPhone] = useState("")
  const [form, setForm] = useState({ STARSENDER_API_URL: "https://api.starsender.online/api", STARSENDER_API_KEY: "" })

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          STARSENDER_API_URL: data.STARSENDER_API_URL || "https://api.starsender.online/api",
          STARSENDER_API_KEY: data.STARSENDER_API_KEY || "",
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    for (const [key, value] of Object.entries(form)) {
      await fetch("/api/super-admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      })
    }
    setSaving(false)
    toast({ title: "Disimpan", description: "Konfigurasi WhatsApp platform berhasil disimpan." })
  }

  const handleTest = async () => {
    if (!testPhone) { toast({ title: "Isi nomor tujuan", variant: "destructive" }); return }
    setTesting(true)
    const res = await fetch("/api/tenant/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "whatsapp", waApiUrl: form.STARSENDER_API_URL, waApiKey: form.STARSENDER_API_KEY, waPhone: testPhone }),
    })
    const data = await res.json()
    setTesting(false)
    res.ok ? toast({ title: "✅ Berhasil!", description: data.message })
            : toast({ title: "❌ Gagal", description: data.error, variant: "destructive" })
  }

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Gateway Platform</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi StarSender default untuk seluruh platform.</p>
        </div>
        <Button className="gap-2 btn-gradient text-white border-0 rounded-xl" onClick={handleSave} disabled={saving}>
          {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
          Simpan
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><MessageCircle className="h-4 w-4 text-emerald-500" /></div>
              <div><CardTitle className="text-lg">Konfigurasi StarSender</CardTitle><CardDescription>API URL dan API Key</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>API URL</Label><Input value={form.STARSENDER_API_URL} onChange={(e) => setForm({ ...form, STARSENDER_API_URL: e.target.value })} className="rounded-xl" /></div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input type={showKey ? "text" : "password"} value={form.STARSENDER_API_KEY} onChange={(e) => setForm({ ...form, STARSENDER_API_KEY: e.target.value })} placeholder="API Key dari StarSender" className="rounded-xl pr-10" />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10"><Send className="h-4 w-4 text-emerald-500" /></div>
              <div><CardTitle className="text-lg">Test Koneksi</CardTitle><CardDescription>Kirim pesan test ke WhatsApp</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2"><Label>Nomor Tujuan</Label><Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="6281234567890" className="rounded-xl" /></div>
            <Button variant="outline" className="w-full rounded-xl gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/5" onClick={handleTest} disabled={testing || !form.STARSENDER_API_KEY}>
              {testing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" /> : <Send className="h-4 w-4" />}
              {testing ? "Mengirim..." : "Kirim Pesan Test"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-emerald-500/20 bg-emerald-500/5">
        <CardContent className="p-5 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="text-sm"><p className="font-semibold mb-1">StarSender</p>
            <p className="text-muted-foreground">Daftar di <a href="https://starsender.online" target="_blank" rel="noopener" className="text-emerald-600 hover:underline">starsender.online</a> dan salin API Key dari menu Settings → API.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
