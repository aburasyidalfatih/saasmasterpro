/**
 * API Internal: Domain Lookup untuk Proxy
 *
 * GET /api/internal/domain-lookup?domain=mybusiness.com
 *
 * Dipakai oleh proxy.ts (Edge Runtime) yang tidak bisa query Prisma langsung.
 * Proxy memanggil endpoint ini untuk resolve custom domain → tenant slug.
 *
 * KEAMANAN:
 * - Hanya bisa dipanggil dari internal (cek header x-internal-secret)
 * - Tidak butuh auth session (dipanggil sebelum auth check di proxy)
 * - Response di-cache di Redis oleh domain service
 */

import { NextResponse } from "next/server"
import { resolveDomainToSlug } from "@/lib/services/domain"

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "dev-internal-secret"

export async function GET(req: Request) {
  // Validasi internal secret
  const secret = req.headers.get("x-internal-secret")
  if (secret !== INTERNAL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const url = new URL(req.url)
  const domain = url.searchParams.get("domain")

  if (!domain) {
    return NextResponse.json({ error: "domain harus diisi" }, { status: 400 })
  }

  const slug = await resolveDomainToSlug(domain)

  if (!slug) {
    return NextResponse.json({ slug: null }, { status: 404 })
  }

  return NextResponse.json(
    { slug },
    {
      headers: {
        // Cache di CDN/edge selama 5 menit
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    }
  )
}
