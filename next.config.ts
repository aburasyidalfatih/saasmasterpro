import type { NextConfig } from "next"

/**
 * Domain gambar yang diizinkan untuk Next.js Image Optimization.
 * Tambahkan domain baru di sini jika dibutuhkan — jangan gunakan wildcard "**"
 * karena membuka potensi SSRF via image proxy.
 */
const ALLOWED_IMAGE_DOMAINS = [
  // Google OAuth avatars
  { protocol: "https" as const, hostname: "lh3.googleusercontent.com" },
  // GitHub avatars (jika OAuth GitHub ditambahkan)
  { protocol: "https" as const, hostname: "avatars.githubusercontent.com" },
  // Gravatar
  { protocol: "https" as const, hostname: "www.gravatar.com" },
  // Upload lokal via Next.js public folder (tidak perlu remotePattern)
]

/**
 * Security headers yang diterapkan ke semua halaman.
 * Middleware (src/middleware.ts) juga menambahkan headers ini
 * untuk dynamic responses.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    // max-age 1 tahun — aktifkan includeSubDomains jika semua subdomain pakai HTTPS
    value: "max-age=31536000; includeSubDomains",
  },
  {
    // CSP dasar — sesuaikan jika ada CDN atau third-party script
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js butuh 'unsafe-inline' untuk style dan script di dev
      // Di production idealnya pakai nonce, tapi ini sudah jauh lebih baik dari tidak ada CSP
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: ALLOWED_IMAGE_DOMAINS,
  },
  async headers() {
    return [
      {
        // Terapkan ke semua route
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
