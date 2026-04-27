import { db } from "@/lib/db"
import { Prisma } from "@prisma/client"

interface AuditParams {
  tenantId?: string
  userId?: string
  action: string
  entity: string
  entityId?: string
  oldData?: Record<string, unknown>
  newData?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export async function createAuditLog(params: AuditParams) {
  return db.auditLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      oldData: params.oldData ? (params.oldData as Prisma.InputJsonValue) : Prisma.DbNull,
      newData: params.newData ? (params.newData as Prisma.InputJsonValue) : Prisma.DbNull,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  })
}

export async function getAuditLogs(params: {
  tenantId?: string
  userId?: string
  entity?: string
  page?: number
  limit?: number
}) {
  const page = params.page || 1
  const limit = params.limit || 20
  const skip = (page - 1) * limit

  const where: Prisma.AuditLogWhereInput = {}
  if (params.tenantId) where.tenantId = params.tenantId
  if (params.userId) where.userId = params.userId
  if (params.entity) where.entity = params.entity

  const [data, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.auditLog.count({ where }),
  ])

  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}
