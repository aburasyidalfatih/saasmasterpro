"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Check, Clock, Receipt, ArrowRight } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

const plans = [
  { name: "Gratis", price: 0, priceLabel: "Rp 0", period: "selamanya", plan: "free", features: ["1 Pengguna", "100 Data", "Notifikasi In-App"] },
  { name: "Pro", price: 199000, priceLabel: "Rp 199.000", period: "/bulan", plan: "pro", popular: true, features: ["10 Pengguna", "Data Tak Terbatas", "Semua Notifikasi", "Export Excel", "Dukungan Prioritas"] },
  { name: "Enterprise", price: 499000, priceLabel: "Rp 499.000", period: "/bulan", plan: "enterprise", features: ["Pengguna Tak Terbatas", "Custom Domain", "API Access", "Dukungan Dedicated"] },
]

interface Payment { id: string; reference: string; amount: number; status: string; plan: string; createdAt: string; paidAt: string | null }

export default function BillingPage() {
  const { data: session } = useSession()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [currentPlan, setCurrentPlan] = useState("free")

  useEffect(() => {
    const id = session?.user?.tenants?.[0]?.id
    if (!id) return
    setTenantId(id)
    // Fetch payment history
    fetch(`/api/tenant/billing?tenantId=${id}`)
      .then((r) => r.json())
      .then((data) => { setPayments(data.data || []); setCurrentPlan(data.plan || "free"); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session])

  const handleUpgrade = async (plan: typeof plans[0]) => {
    if (!tenantId) return
    setUpgrading(plan.plan)
    const res = await fetch("/api/tenant/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId, plan: plan.plan, amount: plan.price }),
    })
    const data = await res.json()
    setUpgrading(null)
    if (res.ok && data.paymentUrl) {
      window.open(data.paymentUrl, "_blank")
    } else {
      toast({ title: "Gagal", description: data.error || "Tidak dapat membuat transaksi.", variant: "destructive" })
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: "bg-emerald-500/10 text-emerald-600",
      pending: "bg-amber-500/10 text-amber-600",
      failed: "bg-destructive/10 text-destructive",
      expired: "bg-muted text-muted-foreground",
    }
    return map[status] || map.pending
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Langganan</h1>
        <p className="text-muted-foreground">Kelola paket langganan Anda</p>
      </div>

      {/* Current plan badge */}
      <Card className="glass border-0">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Paket Aktif</p>
            <p className="text-lg font-bold capitalize">{currentPlan}</p>
          </div>
          <span className="ml-auto text-xs bg-primary/10 text-primary rounded-full px-3 py-1 font-semibold capitalize">{currentPlan}</span>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid gap-5 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.plan
          return (
            <Card key={plan.name} className={`glass border-0 relative ${plan.popular ? "ring-2 ring-primary" : ""}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full btn-gradient px-4 py-1 text-xs font-semibold text-white shadow">
                  Paling Populer
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {isCurrent && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-1">Aktif</span>}
                </CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{plan.priceLabel}</span>
                  <span className="text-sm text-muted-foreground"> {plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full rounded-xl gap-2 ${plan.popular && !isCurrent ? "btn-gradient text-white border-0" : ""}`}
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || plan.price === 0 || upgrading === plan.plan}
                  onClick={() => !isCurrent && plan.price > 0 && handleUpgrade(plan)}
                >
                  {upgrading === plan.plan ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : isCurrent ? (
                    "Paket Saat Ini"
                  ) : plan.price === 0 ? (
                    "Gratis"
                  ) : (
                    <><ArrowRight className="h-4 w-4" /> Upgrade</>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Payment history */}
      <Card className="glass border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10"><Receipt className="h-4 w-4 text-primary" /></div>
            <div><CardTitle className="text-lg">Riwayat Pembayaran</CardTitle><CardDescription>Transaksi langganan Anda</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">{[1,2].map(i => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Belum ada riwayat pembayaran</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-semibold capitalize">{p.plan}</p>
                    <p className="text-xs text-muted-foreground">{p.reference} · {formatDate(p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(p.amount)}</p>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${statusBadge(p.status)}`}>{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
