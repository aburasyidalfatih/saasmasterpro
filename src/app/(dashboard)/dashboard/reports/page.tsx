"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"

export default function ReportsPage() {
  const { data: session } = useSession()
  const [exporting, setExporting] = useState(false)
  const [stats, setStats] = useState<{ userCount: number; notifCount: number; auditCount: number } | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (!id) return
    setTenantId(id)
    fetch(`/api/tenant/stats?tenantId=${id}`)
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [session])

  const barData = [
    { bulan: "Jan", nilai: 0 }, { bulan: "Feb", nilai: 0 }, { bulan: "Mar", nilai: 0 },
    { bulan: "Apr", nilai: 0 }, { bulan: "Mei", nilai: 0 }, { bulan: "Jun", nilai: 0 },
  ]

  const pieData = [
    { name: "Aktif", value: stats?.userCount || 0, color: "hsl(var(--primary))" },
    { name: "Notifikasi", value: stats?.notifCount || 0, color: "hsl(var(--muted-foreground))" },
  ]

  const handleExport = async () => {
    if (!tenantId) return
    setExporting(true)
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: `laporan-${new Date().toISOString().slice(0, 10)}`,
          columns: [
            { header: "Metrik", key: "metric" },
            { header: "Nilai", key: "value" },
          ],
          data: [
            { metric: "Total Pengguna", value: stats?.userCount ?? 0 },
            { metric: "Notifikasi Belum Dibaca", value: stats?.notifCount ?? 0 },
            { metric: "Total Aktivitas", value: stats?.auditCount ?? 0 },
          ],
        }),
      })
      if (!res.ok) throw new Error("Export gagal")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `laporan-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: "Export berhasil", description: "File Excel berhasil diunduh." })
    } catch {
      toast({ title: "Gagal export", description: "Terjadi kesalahan saat mengekspor data.", variant: "destructive" })
    }
    setExporting(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Laporan & Analitik</h1>
          <p className="text-muted-foreground">Analisis data organisasi Anda</p>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl" onClick={handleExport} disabled={exporting}>
          {exporting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" /> : <Download className="h-4 w-4" />}
          {exporting ? "Mengekspor..." : "Export Excel"}
        </Button>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Pengguna", value: stats?.userCount ?? "—" },
          { label: "Notifikasi Belum Dibaca", value: stats?.notifCount ?? "—" },
          { label: "Total Aktivitas", value: stats?.auditCount ?? "—" },
        ].map((s) => (
          <Card key={s.label} className="glass border-0">
            <CardContent className="p-5 text-center">
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass border-0">
          <CardHeader><CardTitle className="text-lg">Aktivitas Bulanan</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" vertical={false} />
                <XAxis dataKey="bulan" className="text-xs" axisLine={false} tickLine={false} />
                <YAxis className="text-xs" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="nilai" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass border-0">
          <CardHeader><CardTitle className="text-lg">Distribusi Data</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
