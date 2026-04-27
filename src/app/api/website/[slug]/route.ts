import { NextResponse } from "next/server"
import { db } from "@/lib/db"

// Public API — no auth required. Used by tenant website pages.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const tenant = await db.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      description: true,
      tagline: true,
      about: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      whatsapp: true,
      instagram: true,
      facebook: true,
      youtube: true,
      services: true,
      heroImage: true,
      gallery: true,
      theme: true,
      isActive: true,
    },
  })

  if (!tenant || !tenant.isActive) {
    return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 })
  }

  // Native Json fields — Prisma returns parsed objects directly
  return NextResponse.json(tenant)
}
