import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const settingsSchema = z.object({
  tenantId: z.string().min(1),
  settings: z.record(z.string(), z.any()),
})

// GET: ambil settings tenant (termasuk SMTP & WA config)
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  // Cek izin
  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
    }
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })

  const settings = (tenant?.settings as Record<string, any>) || {}
  return NextResponse.json(settings)
}

// PUT: update settings tenant
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, settingsSchema)
  if (parsed.error) return parsed.error
  const { tenantId, settings } = parsed.data

  // Cek izin
  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
    }
  }

  // Merge dengan settings yang sudah ada
  const existing = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  })
  const existingSettings = (existing?.settings as Record<string, any>) || {}
  const merged = { ...existingSettings, ...settings }

  await db.tenant.update({
    where: { id: tenantId },
    data: { settings: merged },
  })

  return NextResponse.json({ message: "Pengaturan disimpan" })
}
