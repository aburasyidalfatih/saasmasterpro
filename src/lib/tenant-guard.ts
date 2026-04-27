import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { Session } from "next-auth"

interface TenantAccessResult {
  membership: {
    id: string
    tenantId: string
    userId: string
    role: string
  }
  session: Session
  error: null
}

interface TenantAccessError {
  membership: null
  session: null
  error: NextResponse
}

/**
 * Verify the current user has access to a specific tenant.
 * Returns the membership record with role information.
 */
export async function requireTenantAccess(
  tenantId: string
): Promise<TenantAccessResult | TenantAccessError> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      membership: null,
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  // Super admins bypass tenant membership check (for impersonation scenarios)
  if (session.user.isSuperAdmin) {
    return {
      membership: {
        id: "super-admin",
        tenantId,
        userId: session.user.id,
        role: "owner",
      },
      session,
      error: null,
    }
  }

  const membership = await db.tenantUser.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId: session.user.id,
      },
    },
  })

  if (!membership) {
    return {
      membership: null,
      session: null,
      error: NextResponse.json({ error: "Forbidden — no access to this tenant" }, { status: 403 }),
    }
  }

  return { membership, session, error: null }
}

/**
 * Verify the current user has admin (owner or admin) access to a tenant.
 */
export async function requireTenantAdmin(
  tenantId: string
): Promise<TenantAccessResult | TenantAccessError> {
  const result = await requireTenantAccess(tenantId)

  if (result.error) return result

  if (result.membership.role !== "owner" && result.membership.role !== "admin") {
    return {
      membership: null,
      session: null,
      error: NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 }
      ),
    }
  }

  return result
}

/**
 * Verify the current user is the owner of a tenant.
 */
export async function requireTenantOwner(
  tenantId: string
): Promise<TenantAccessResult | TenantAccessError> {
  const result = await requireTenantAccess(tenantId)

  if (result.error) return result

  if (result.membership.role !== "owner") {
    return {
      membership: null,
      session: null,
      error: NextResponse.json(
        { error: "Forbidden — owner access required" },
        { status: 403 }
      ),
    }
  }

  return result
}
