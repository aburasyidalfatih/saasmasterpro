/**
 * Next.js 16+ Proxy
 *
 * Menangani tiga jenis request:
 * 1. Main domain (saasmasterpro.com) — auth protection
 * 2. Subdomain (tenant.saasmasterpro.com) — tenant routing
 * 3. Custom domain (mybusiness.com) — custom domain tenant routing
 *
 * EDGE RUNTIME: file ini tidak boleh mengimport Node.js modules.
 * Custom domain lookup dilakukan via fetch ke API internal.
 */

import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authConfig } from "@/lib/auth.config"

const { auth } = NextAuth(authConfig)

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "dev-internal-secret"

// ==================== CUSTOM DOMAIN LOOKUP ====================
/**
 * Resolve custom domain → tenant slug via API internal.
 * Proxy tidak bisa query Prisma (Edge Runtime), jadi pakai fetch.
 * Response di-cache di CDN/edge selama 5 menit.
 */
async function resolveCustomDomain(
  domain: string,
  requestUrl: string
): Promise<string | null> {
  try {
    const base = new URL(requestUrl).origin
    const res = await fetch(
      `${base}/api/internal/domain-lookup?domain=${encodeURIComponent(domain)}`,
      {
        headers: { "x-internal-secret": INTERNAL_SECRET },
        // next.js fetch cache — revalidate setiap 5 menit
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.slug ?? null
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000"
  const { pathname } = request.nextUrl

  // Validasi JWT via NextAuth — edge-safe
  const session = await auth()

  // ============================================================
  // KLASIFIKASI HOST
  // ============================================================
  const isMainDomain =
    hostname === rootDomain ||
    hostname === `www.${rootDomain}` ||
    hostname === "localhost:3000"

  const subdomain = hostname.replace(`.${rootDomain}`, "")
  const isSubdomain =
    !isMainDomain &&
    subdomain !== hostname &&
    subdomain !== "www" &&
    subdomain !== ""

  const isCustomDomain = !isMainDomain && !isSubdomain

  // ============================================================
  // 1. MAIN DOMAIN — auth protection
  // ============================================================
  if (isMainDomain) {
    const isProtectedDashboard = pathname.startsWith("/dashboard")
    const isProtectedSuperAdmin = pathname.startsWith("/super-admin")
    const isAuthPage =
      pathname.startsWith("/login") ||
      pathname.startsWith("/register") ||
      pathname.startsWith("/forgot-password") ||
      pathname.startsWith("/reset-password")

    if ((isProtectedDashboard || isProtectedSuperAdmin) && !session) {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return addSecurityHeaders(NextResponse.redirect(loginUrl))
    }

    if (isProtectedSuperAdmin && session && !session.user?.isSuperAdmin) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url))
      )
    }

    if (isAuthPage && session) {
      const dest = session.user?.isSuperAdmin ? "/super-admin" : "/dashboard"
      return addSecurityHeaders(NextResponse.redirect(new URL(dest, request.url)))
    }

    return addSecurityHeaders(NextResponse.next())
  }

  // ============================================================
  // 2. SUBDOMAIN — tenant routing
  // ============================================================
  if (isSubdomain) {
    const url = request.nextUrl.clone()

    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register")
    ) {
      const response = NextResponse.rewrite(url)
      response.headers.set("x-tenant-slug", subdomain)
      return addSecurityHeaders(response)
    }

    url.pathname = `/site/${subdomain}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set("x-tenant-slug", subdomain)
    return addSecurityHeaders(response)
  }

  // ============================================================
  // 3. CUSTOM DOMAIN — resolve ke tenant slug
  // ============================================================
  if (isCustomDomain) {
    // Jangan intercept request internal agar tidak loop
    if (pathname.startsWith("/api/internal/")) {
      return addSecurityHeaders(NextResponse.next())
    }

    const slug = await resolveCustomDomain(hostname, request.url)

    if (!slug) {
      // Domain tidak terdaftar atau belum verified — tampilkan 404
      return addSecurityHeaders(
        NextResponse.rewrite(new URL("/not-found", request.url))
      )
    }

    const url = request.nextUrl.clone()
    url.pathname = `/site/${slug}${pathname}`
    const response = NextResponse.rewrite(url)
    response.headers.set("x-tenant-slug", slug)
    response.headers.set("x-custom-domain", hostname)
    return addSecurityHeaders(response)
  }

  return addSecurityHeaders(NextResponse.next())
}

/**
 * Tambahkan security headers ke setiap response.
 * next.config.ts menangani headers untuk static responses,
 * proxy ini memastikan headers juga ada di dynamic responses.
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  )
  return response
}

export const config = {
  matcher: [
    // Jalankan di semua route kecuali static assets
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png).*)",
  ],
}
