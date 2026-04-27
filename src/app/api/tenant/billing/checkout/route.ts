import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createTransaction } from "@/lib/services/payment"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const schema = z.object({
  tenantId: z.string().min(1),
  plan: z.enum(["pro", "enterprise"]),
  amount: z.number().positive(),
  method: z.string().optional().default("QRIS"),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, schema)
  if (parsed.error) return parsed.error
  const { tenantId, plan, amount, method } = parsed.data

  // Cek izin
  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId: session.user.id } },
  })
  if (!tu || !["owner", "admin"].includes(tu.role)) {
    return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, phone: true },
  })

  if (!user?.email) {
    return NextResponse.json({ error: "Data user tidak lengkap" }, { status: 400 })
  }

  try {
    const result = await createTransaction({
      tenantId,
      plan,
      amount,
      method: method ?? "QRIS",
      customerName: user.name ?? "User",
      customerEmail: user.email,
      customerPhone: user.phone ?? "",
    })

    if (result.success) {
      return NextResponse.json({ paymentUrl: result.data.checkout_url })
    } else {
      return NextResponse.json({ error: result.message || "Gagal membuat transaksi" }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Terjadi kesalahan" }, { status: 500 })
  }
}
