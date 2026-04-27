/**
 * API: Verifikasi DNS Custom Domain
 *
 * POST /api/tenant/domain/verify
 * Body: { tenantId: string }
 *
 * Mengecek apakah TXT record sudah ditambahkan di DNS tenant.
 * Jika berhasil: update status → "verified", simpan domain ke cache.
 * Jika gagal: update status → "failed", simpan alasan kegagalan.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { parseBody, requireAuth } from "@/lib/api-utils"
import {
  verifyDomainDns,
  getDomainSettings,
  cacheDomainSlug,
  invalidateDomainCache,
  type DomainStatus,
} from "@/lib/services/domain"

const verifySchema = z.object({
  tenantId: z.string().min(1, "tenantId harus diisi"),
})

export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const parsed = await parseBody(req, verifySchema)
  if (parsed.error) return parsed.error
  const { tenantId } = parsed.data

  // Cek akses — hanya owner/admin
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
    select: { domain: true, slug: true, settings: true },
  })

  if (!tenant) {
    return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
  }

  const domainSettings = getDomainSettings(tenant.settings as any)

  if (!domainSettings || !tenant.domain) {
    return NextResponse.json(
      { error: "Belum ada custom domain yang dikonfigurasi" },
      { status: 400 }
    )
  }

  if (domainSettings.status === "verified") {
    return NextResponse.json({
      message: "Domain sudah terverifikasi",
      customDomain: domainSettings,
    })
  }

  // Jalankan DNS check
  const result = await verifyDomainDns(tenant.domain, domainSettings.verifyToken)

  const newStatus: DomainStatus = result.success ? "verified" : "failed"
  const updatedDomainSettings = {
    ...domainSettings,
    status: newStatus,
    ...(result.success ? { verifiedAt: new Date().toISOString(), failReason: undefined } : {}),
    ...(!result.success ? { failReason: result.reason } : {}),
  }

  const existingSettings = (tenant.settings as Record<string, any>) || {}
  await db.tenant.update({
    where: { id: tenantId },
    data: {
      settings: { ...existingSettings, customDomain: updatedDomainSettings },
    },
  })

  if (result.success) {
    // Simpan ke cache agar proxy bisa resolve tanpa query DB
    await cacheDomainSlug(tenant.domain, tenant.slug)
    logger.info("Domain verified", { tenantId, domain: tenant.domain })
  } else {
    // Pastikan cache tidak menyimpan domain yang gagal
    await invalidateDomainCache(tenant.domain)
    logger.warn("Domain verification failed", {
      tenantId,
      domain: tenant.domain,
      reason: result.reason,
    })
  }

  return NextResponse.json({
    success: result.success,
    message: result.success
      ? "Domain berhasil diverifikasi! Website Anda sekarang dapat diakses via custom domain."
      : "Verifikasi gagal. " + result.reason,
    customDomain: updatedDomainSettings,
  })
}
