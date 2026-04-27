import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const [tenant, payments] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId }, select: { plan: true } }),
    db.payment.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  return NextResponse.json({ plan: tenant?.plan || "free", data: payments })
}
