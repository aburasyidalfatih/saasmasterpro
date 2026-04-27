import { describe, it, expect, vi, beforeEach } from "vitest"

const mockCreate = vi.fn()
const mockFindMany = vi.fn()
const mockCount = vi.fn()

vi.mock("@/lib/db", () => ({
  db: {
    auditLog: {
      create: (...args: any[]) => mockCreate(...args),
      findMany: (...args: any[]) => mockFindMany(...args),
      count: (...args: any[]) => mockCount(...args),
    },
  },
}))

describe("Audit Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("createAuditLog", () => {
    it("creates audit log with all fields", async () => {
      mockCreate.mockResolvedValue({ id: "1" })

      const { createAuditLog } = await import("@/lib/services/audit")
      await createAuditLog({
        tenantId: "tenant-1",
        userId: "user-1",
        action: "create",
        entity: "user",
        entityId: "user-2",
        oldData: undefined,
        newData: { name: "New User" },
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId: "tenant-1",
          userId: "user-1",
          action: "create",
          entity: "user",
          entityId: "user-2",
          newData: { name: "New User" },
          ipAddress: "127.0.0.1",
        }),
      })
    })

    it("handles null optional fields", async () => {
      mockCreate.mockResolvedValue({ id: "1" })

      const { createAuditLog } = await import("@/lib/services/audit")
      await createAuditLog({
        action: "login",
        entity: "session",
      })

      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "login",
          entity: "session",
          tenantId: undefined,
          userId: undefined,
          oldData: null,
          newData: null,
        }),
      })
    })
  })

  describe("getAuditLogs", () => {
    it("returns paginated results", async () => {
      mockFindMany.mockResolvedValue([{ id: "1" }, { id: "2" }])
      mockCount.mockResolvedValue(50)

      const { getAuditLogs } = await import("@/lib/services/audit")
      const result = await getAuditLogs({ tenantId: "tenant-1", page: 2, limit: 10 })

      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(50)
      expect(result.page).toBe(2)
      expect(result.totalPages).toBe(5)
    })

    it("uses default pagination", async () => {
      mockFindMany.mockResolvedValue([])
      mockCount.mockResolvedValue(0)

      const { getAuditLogs } = await import("@/lib/services/audit")
      const result = await getAuditLogs({})

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })
  })
})
