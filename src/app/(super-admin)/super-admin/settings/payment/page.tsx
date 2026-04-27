"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { CreditCard, Save, Eye, EyeOff, RefreshCw, CheckCircle, ExternalLink } from "lucide-react"

export default function SuperAdminPaymentPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPrivate, setShowPrivate] = useState(false)
  const [showApi, setShowApi] = useState(false)
  const [channels, setChannels] = useState<any[]>([])
  const [form, setForm] = useState({
    TRIPAY_API_KEY: "", TRIPAY_PRIVATE_KEY: "", TRIPAY_MERCHANT_CODE: "",
    TRIPAY_API_URL: "https://tripay.co.id/api-sandbox",
  })

  useEffect(() => {
    fetch("/api/super-admin/settings")
      .then((r) => r.json())
      .then((data) => {
        setForm({
          TRIPAY_API_KEY: data.TRIPAY_API_KEY || "",
          TRIPAY_PRIVATE_KEY: data.TRIPAY_PRIVATE_KEY || "",
          TRIPAY_MERCHANT_CODE: data.TRIPAY_MERCHANT_CODE || "",
          TRIPAY_API_URL: data.TRIPAY_API_URL || "https://tripay.co.id/api-sandbox",
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })

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
    toast({ title: "Disimpan", description: "Konfigurasi Tripay platform berhasil disimpan." })
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const res = await fetch(`${form.TRIPAY_API_URL}/merchant/payment-channel`, {
        headers: { Authorization: `Bearer ${form.TRIPAY_API_KEY}` },
      })
      const data = await res.json()
      if (data.success && data.data?.length) {
        setChannels(data.data)
        toast({ title: "✅ Berhasil!", description: `${data.data.length} channel tersedia.` })
      } else {
        toast({ title: "❌ Gagal", description: data.message || "API Key tidak valid.", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "❌ Error", description: err.message, variant: "destructive" })
    }
    setTesting(false)
  }

  if (loading) return <div className="space-y-4">{[1,2].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>

  const isSandbox = form.TRIPAY_API_URL.includes("sandbox")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payment Gateway Platform</h1>
          <p className="text-muted-foreground mt-1">Konfigurasi Tripay default untuk seluruh platform.</p>
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><CreditCard className="h-4 w-4 text-primary" /></div>
              <div><CardTitle className="text-lg">Kredensial Tripay</CardTitle><CardDescription>API Key, Private Key, Merchant Code</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Sandbox", url: "https://tripay.co.id/api-sandbox", sandbox: true },
                { label: "Production", url: "https://tripay.co.id/api", sandbox: false },
              ].map((m) => (
                <button key={m.label} onClick={() => setForm({ ...form, TRIPAY_API_URL: m.url })}
                  className={`rounded-xl border-2 py-2.5 text-sm font-semibold transition-all ${isSandbox === m.sandbox ? (m.sandbox ? "border-amber-500 bg-amber-500/10 text-amber-600" : "border-emerald-500 bg-emerald-500/10 text-emerald-600") : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"}`}>
                  {m.sandbox ? "🧪" : "🚀"} {m.label}
                </button>
              ))}
            </div>
            <div className="space-y-2"><Label>Merchant Code</Label><Input value={form.TRIPAY_MERCHANT_CODE} onChange={set("TRIPAY_MERCHANT_CODE")} placeholder="T12345" className="rounded-xl" /></div>
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input type={showApi ? "text" : "password"} value={form.TRIPAY_API_KEY} onChange={set("TRIPAY_API_KEY")} placeholder="API Key" className="rounded-xl pr-10" />
                <button type="button" onClick={() => setShowApi(!showApi)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showApi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Private Key</Label>
              <div className="relative">
                <Input type={showPrivate ? "text" : "password"} value={form.TRIPAY_PRIVATE_KEY} onChange={set("TRIPAY_PRIVATE_KEY")} placeholder="Private Key" className="rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPrivate(!showPrivate)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPrivate ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><RefreshCw className="h-4 w-4 text-primary" /></div>
              <div><CardTitle className="text-lg">Test & Channel</CardTitle><CardDescription>Verifikasi koneksi Tripay</CardDescription></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full rounded-xl gap-2" onClick={handleTest} disabled={testing || !form.TRIPAY_API_KEY}>
              {testing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <RefreshCw className="h-4 w-4" />}
              {testing ? "Mengambil data..." : "Cek Channel Pembayaran"}
            </Button>
            {channels.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {channels.map((ch: any) => (
                  <div key={ch.code} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                    <span className="text-xs font-medium">{ch.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{ch.code}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border border-primary/20 bg-primary/5">
        <CardContent className="p-5 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm"><p className="font-semibold mb-1">Tripay</p>
            <p className="text-muted-foreground flex items-center gap-1">
              <a href="https://tripay.co.id/developer" target="_blank" rel="noopener" className="text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="h-3 w-3" /> Dokumentasi API Tripay
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
