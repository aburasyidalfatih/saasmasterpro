import { describe, it, expect } from "vitest"
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth"

describe("loginSchema", () => {
  it("should accept valid login data", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    })
    expect(result.success).toBe(true)
  })

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    })
    expect(result.success).toBe(false)
  })

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    })
    expect(result.success).toBe(false)
  })
})

describe("registerSchema", () => {
  it("should accept valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "12345678",
      tenantName: "My Organization",
    })
    expect(result.success).toBe(true)
  })

  it("should reject short name", () => {
    const result = registerSchema.safeParse({
      name: "J",
      email: "john@example.com",
      password: "12345678",
      tenantName: "My Organization",
    })
    expect(result.success).toBe(false)
  })

  it("should reject short password", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "1234",
      tenantName: "My Organization",
    })
    expect(result.success).toBe(false)
  })

  it("should reject missing tenant name", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "12345678",
    })
    expect(result.success).toBe(false)
  })
})

describe("forgotPasswordSchema", () => {
  it("should accept valid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "user@example.com" })
    expect(result.success).toBe(true)
  })

  it("should reject invalid email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "bad" })
    expect(result.success).toBe(false)
  })
})

describe("resetPasswordSchema", () => {
  it("should accept valid token and password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "newpass123",
    })
    expect(result.success).toBe(true)
  })

  it("should reject short password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "abc123",
      password: "short",
    })
    expect(result.success).toBe(false)
  })
})
