import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { z } from "zod"
import { parseBody } from "@/lib/api-utils"

const websiteSchema = z.object({
  tenantId: z.string().min(1),
  // Identitas
  name: z.string().min(1).max(100).optional(),
  tagline: z.string().max(200).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  about: z.string().max(5000).optional().nullable(),
  logo: z.string().max(500).optional().nullable(),
  heroImage: z.string().max(500).optional().nullable(),
  // Kontak
  address: z.string().max(300).optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  // Sosial media
  instagram: z.string().max(100).optional().nullable(),
  facebook: z.string().max(100).optional().nullable(),
  youtube: z.string().max(100).optional().nullable(),
  // Konten JSON
  services: z.any().optional().nullable(), // Native Json
  gallery: z.any().optional().nullable(),  // Native Json
})

// GET: ambil data website tenant
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true, name: true, slug: true, tagline: true, description: true,
      about: true, logo: true, heroImage: true, address: true, phone: true,
      email: true, website: true, whatsapp: true, instagram: true,
      facebook: true, youtube: true, services: true, gallery: true,
    },
  })

  if (!tenant) return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })

  // Native Json fields — Prisma returns parsed objects directly
  return NextResponse.json(tenant)
}

// PUT: update data website tenant
export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const parsed = await parseBody(req, websiteSchema)
  if (parsed.error) return parsed.error
  const { tenantId, ...data } = parsed.data

  // Cek izin — hanya owner/admin
  const isSuperAdmin = session.user.isSuperAdmin
  if (!isSuperAdmin) {
    const tu = await db.tenantUser.findUnique({
      where: { tenantId_userId: { tenantId, userId: session.user.id } },
    })
    if (!tu || !["owner", "admin"].includes(tu.role)) {
      return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
    }
  }

  const updated = await db.tenant.update({
    where: { id: tenantId },
    data,
  })

  return NextResponse.json({ message: "Website berhasil diperbarui", tenant: updated })
}
