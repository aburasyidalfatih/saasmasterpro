import { describe, it, expect } from "vitest"
import { cn, formatCurrency, formatDate, generateSlug, truncate } from "@/lib/utils"

describe("cn (classname merge)", () => {
  it("should merge classnames", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1")
  })

  it("should handle conditional classnames", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("should merge conflicting tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4")
  })
})

describe("formatCurrency", () => {
  it("should format IDR currency", () => {
    const result = formatCurrency(100000)
    expect(result).toContain("100.000")
  })

  it("should handle zero", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
  })
})

describe("formatDate", () => {
  it("should format date in Indonesian locale", () => {
    const result = formatDate("2026-01-15T00:00:00Z")
    expect(result).toContain("2026")
  })
})

describe("generateSlug", () => {
  it("should generate slug from text", () => {
    expect(generateSlug("Hello World")).toBe("hello-world")
  })

  it("should handle special characters", () => {
    expect(generateSlug("Test & Slug!")).toBe("test-slug")
  })

  it("should strip leading/trailing hyphens", () => {
    expect(generateSlug("---test---")).toBe("test")
  })

  it("should handle empty string", () => {
    expect(generateSlug("")).toBe("")
  })
})

describe("truncate", () => {
  it("should truncate long strings", () => {
    expect(truncate("Hello World", 5)).toBe("Hello...")
  })

  it("should not truncate short strings", () => {
    expect(truncate("Hi", 10)).toBe("Hi")
  })
})
