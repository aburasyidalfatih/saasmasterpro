import { NextResponse } from "next/server"
import { ZodSchema, ZodError } from "zod"
import { logger } from "@/lib/logger"
import { rateLimit } from "@/lib/rate-limit"
import { auth } from "@/lib/auth"

/**
 * Parse and validate request body with Zod schema.
 * Returns parsed data or NextResponse error.
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const body = await req.json()
    const data = schema.parse(body)
    return { data }
  } catch (err) {
    if (err instanceof ZodError) {
      const messages = err.errors.map((e) => e.message).join(", ")
      return { error: NextResponse.json({ error: messages }, { status: 400 }) }
    }
    return { error: NextResponse.json({ error: "Request body tidak valid" }, { status: 400 }) }
  }
}

/**
 * Wrap API handler with consistent error handling, logging, and optional rate limiting.
 */
export function apiHandler(
  handler: (req: Request) => Promise<NextResponse>,
  options?: {
    /** Rate limit: max requests per window. Disable with `false`. Default: 30 */
    rateLimit?: number | false
    /** Rate limit window in ms. Default: 60000 (1 minute) */
    rateLimitWindowMs?: number
  }
) {
  const { rateLimit: limit = 30, rateLimitWindowMs = 60000 } = options || {}

  return async (req: Request) => {
    try {
      // === Rate Limiting ===
      if (limit !== false) {
        const ip =
          req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          req.headers.get("x-real-ip") ||
          "anonymous"
        const { success, remaining } = await rateLimit(`api:${ip}`, limit, rateLimitWindowMs)
        if (!success) {
          logger.warn("Rate limit exceeded", { ip, path: new URL(req.url).pathname })
          return NextResponse.json(
            { error: "Too many requests. Please try again later." },
            {
              status: 429,
              headers: {
                "Retry-After": String(Math.ceil(rateLimitWindowMs / 1000)),
                "X-RateLimit-Remaining": "0",
              },
            }
          )
        }
      }

      return await handler(req)
    } catch (error) {
      logger.error("API Error", error, {
        path: new URL(req.url).pathname,
        method: req.method,
      })
      return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
    }
  }
}

/**
 * Get the authenticated session or return 401.
 * Use this at the top of protected API routes.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session, error: null }
}

/**
 * Require super admin access or return 403.
 */
export async function requireSuperAdmin() {
  const { session, error } = await requireAuth()
  if (error) return { session: null, error }
  if (!session!.user.isSuperAdmin) {
    return { session: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }
  return { session: session!, error: null }
}
