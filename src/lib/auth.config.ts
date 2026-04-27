/**
 * Edge-compatible auth config — TANPA Node.js modules (Prisma, bcrypt, crypto).
 *
 * File ini dipakai oleh src/middleware.ts yang berjalan di Edge Runtime.
 * src/lib/auth.ts (full config) tetap dipakai oleh API routes dan server components.
 *
 * Pattern ini adalah rekomendasi resmi NextAuth v5:
 * https://authjs.dev/guides/edge-compatibility
 */

import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  // Callbacks minimal — hanya untuk membaca token di middleware
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!
        token.isSuperAdmin = (user as any).isSuperAdmin || false
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.isSuperAdmin = token.isSuperAdmin as boolean
      }
      return session
    },
  },
}
