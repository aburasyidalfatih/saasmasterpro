/**
 * API: Custom Domain Tenant
 *
 * GET  /api/tenant/domain?tenantId=xxx  — ambil status domain saat ini
 * PUT  /api/tenant/domain               — set/update custom domain (reset ke unverified)
 * DELETE /api/tenant/domain             — hapus custom domain
 */

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { parseBody, requireAuth } from "@/lib/api-utils"
import { setDomainSchema, removeDomainSchema } from "@/lib/validations/domain"
import {
  generateVerifyToken,
  getDomainSettings,
  invalidateDomainCache,
} from "@/lib/services/domain"

// ==================== HELPERS ====================

async function checkTenantAccess(tenantId: string, userId: string, isSuperAdmin: boolean) {
  if (isSuperAdmin) return true
  const tu = await db.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  })
  return !!(tu && ["owner", "admin"].includes(tu.role))
}

// ==================== GET ====================

export async function GET(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const url = new URL(req.url)
  const tenantId = url.searchParams.get("tenantId")
  if (!tenantId) {
    return NextResponse.json({ error: "tenantId harus diisi" }, { status: 400 })
  }

  const hasAccess = await checkTenantAccess(tenantId, session.user.id, session.user.isSuperAdmin)
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Tidak punya izin. Pastikan Anda adalah owner atau admin tenant ini." },
      { status: 403 }
    )
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { domain: true, settings: true, slug: true },
  })

  if (!tenant) {
    return NextResponse.json({ error: "Tenant tidak ditemukan" }, { status: 404 })
  }

  const domainSettings = getDomainSettings(tenant.settings as any)

  return NextResponse.json({
    slug: tenant.slug,
    domain: tenant.domain,
    customDomain: domainSettings,
  })
}

// ==================== PUT ====================

export async function PUT(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const parsed = await parseBody(req, setDomainSchema)
  if (parsed.error) return parsed.error
  const { tenantId, domain } = parsed.data

  const hasAccess = await checkTenantAccess(tenantId, session.user.id, session.user.isSuperAdmin)
  if (!hasAccess) {
    return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
  }

  // Cek domain tidak dipakai tenant lain
  const existing = await db.tenant.findFirst({
    where: { domain, NOT: { id: tenantId } },
    select: { id: true },
  })
  if (existing) {
    return NextResponse.json({ error: "Domain sudah digunakan oleh tenant lain" }, { status: 409 })
  }

  // Ambil domain lama untuk invalidate cache
  const currentTenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { domain: true, settings: true },
  })

  const oldDomain = currentTenant?.domain
  const existingSettings = (currentTenant?.settings as Record<string, any>) || {}
  const existingDomainSettings = getDomainSettings(existingSettings)

  // Jika domain sama dan sudah verified, tidak perlu reset
  if (existingDomainSettings?.domain === domain && existingDomainSettings?.status === "verified") {
    return NextResponse.json({
      message: "Domain sudah terdaftar dan terverifikasi",
      customDomain: existingDomainSettings,
    })
  }

  // Generate token baru (atau pakai yang lama jika domain sama)
  const verifyToken =
    existingDomainSettings?.domain === domain && existingDomainSettings?.verifyToken
      ? existingDomainSettings.verifyToken
      : generateVerifyToken()

  const newDomainSettings = {
    domain,
    status: "unverified" as const,
    verifyToken,
  }

  // Invalidate cache domain lama
  if (oldDomain && oldDomain !== domain) {
    await invalidateDomainCache(oldDomain)
  }

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      domain,
      settings: {
        ...existingSettings,
        customDomain: newDomainSettings,
      },
    },
  })

  logger.info("Custom domain set", { tenantId, domain, userId: session.user.id })

  return NextResponse.json({
    message: "Domain berhasil disimpan. Silahkan verifikasi DNS.",
    customDomain: newDomainSettings,
  })
}

// ==================== DELETE ====================

export async function DELETE(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const parsed = await parseBody(req, removeDomainSchema)
  if (parsed.error) return parsed.error
  const { tenantId } = parsed.data

  const hasAccess = await checkTenantAccess(tenantId, session.user.id, session.user.isSuperAdmin)
  if (!hasAccess) {
    return NextResponse.json({ error: "Tidak punya izin" }, { status: 403 })
  }

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: { domain: true, settings: true },
  })

  if (!tenant?.domain) {
    return NextResponse.json({ error: "Tidak ada custom domain yang terdaftar" }, { status: 404 })
  }

  // Invalidate cache
  await invalidateDomainCache(tenant.domain)

  // Hapus domain dan customDomain dari settings
  const existingSettings = (tenant.settings as Record<string, any>) || {}
  const { customDomain: _, ...restSettings } = existingSettings

  await db.tenant.update({
    where: { id: tenantId },
    data: {
      domain: null,
      settings: restSettings,
    },
  })

  logger.info("Custom domain removed", { tenantId, domain: tenant.domain, userId: session.user.id })

  return NextResponse.json({ message: "Custom domain berhasil dihapus" })
}
